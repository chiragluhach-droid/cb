import { NextResponse } from "next/server";
import type { UpdateFilter } from "mongodb";
import { ClientDataDoc, cols } from "@/lib/server/mongo";
import { coachMessage, loadClient } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";
import { isDishId, readPicks, readText } from "@/lib/server/validate";

/*
 * PATCH /api/admin/clients/:id — one coach action per request:
 *   { op: "planEdit", day, slot, dishId | null }
 *   { op: "approve", note }
 *   { op: "message", text }
 *   { op: "read" }
 *   { op: "notes", text }
 *   { op: "aiDraft", picks, model, note, instruction? }
 *   { op: "undoAi" }
 */

export const runtime = "nodejs";

const SLOT = /^(breakfast|lunch|snack|dinner)$/;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  const { id } = await ctx.params;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const { clientdata } = await cols();
    const cur = await clientdata.findOne({ _id: id });
    if (!cur) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    let update: UpdateFilter<ClientDataDoc> | null = null;
    switch (b.op) {
      case "planEdit": {
        const day = Number(b.day);
        if (!Number.isInteger(day) || day < 0 || day > 6 || typeof b.slot !== "string" || !SLOT.test(b.slot)) break;
        const key = `planEdits.${day}-${b.slot}`;
        update = isDishId(b.dishId) ? { $set: { [key]: b.dishId } } : { $unset: { [key]: "" } };
        break;
      }
      case "approve":
        if (!cur.profile) return NextResponse.json({ error: "This client hasn't finished the questionnaire." }, { status: 400 });
        update = {
          $set: { planStatus: "approved", approvedAt: Date.now() },
          $push: { messages: coachMessage(readText(b.note) ?? "Your plan is approved ✓ Tick meals off as you go and message me anytime.") },
        };
        break;
      case "message": {
        const text = readText(b.text);
        if (text) update = { $push: { messages: coachMessage(text) }, $set: { coachReadAt: Date.now() } };
        break;
      }
      case "read":
        update = { $set: { coachReadAt: Date.now() } };
        break;
      case "notes":
        update = { $set: { coachNotes: typeof b.text === "string" ? b.text.slice(0, 5000) : "" } };
        break;
      case "aiDraft": {
        const picks = readPicks(b.picks);
        if (!Object.keys(picks).length) break;
        update = {
          $set: {
            planEdits: picks,
            aiDraft: {
              at: Date.now(),
              model: typeof b.model === "string" ? b.model.slice(0, 80) : "",
              note: typeof b.note === "string" ? b.note.slice(0, 400) : "",
              instruction: readText(b.instruction, 300) ?? undefined,
              picks,
              // Keep what the plan looked like before the first AI draft, for undo.
              prevEdits: cur.aiDraft ? cur.aiDraft.prevEdits ?? {} : cur.planEdits ?? {},
            },
          },
        };
        break;
      }
      case "undoAi":
        update = { $set: { planEdits: cur.aiDraft?.prevEdits ?? {} }, $unset: { aiDraft: "" } };
        break;
    }
    if (!update) return NextResponse.json({ error: "Unknown or invalid action." }, { status: 400 });
    await clientdata.updateOne({ _id: id }, update);
    return NextResponse.json(await loadClient(id));
  } catch (e) {
    console.error("admin client PATCH failed", e);
    return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 503 });
  }
}
