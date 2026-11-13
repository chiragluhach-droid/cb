import { NextResponse } from "next/server";
import type { UpdateFilter } from "mongodb";
import { accessOf, hasAccess } from "@/lib/server/billing";
import { ClientDataDoc, cols } from "@/lib/server/mongo";
import { coachMessage, freshData, loadClient, newId, today, welcomeMessage } from "@/lib/server/repo";
import { clientId } from "@/lib/server/session";
import { isDayKey, readDayLog, readProfile, readText, readWeights, validName, validPlan } from "@/lib/server/validate";

/*
 * GET  /api/me — the signed-in client's account and dashboard data.
 * PATCH /api/me — save changes. Only the fields that changed are sent, and each
 * is written on its own ($set / $push), so the client and the coach can't
 * overwrite each other's work.
 */

export const runtime = "nodejs";

const unauth = () => NextResponse.json({ error: "Not signed in." }, { status: 401 });

export async function GET() {
  const id = await clientId();
  if (!id) return unauth();
  try {
    const me = await loadClient(id);
    return me ? NextResponse.json(me) : unauth();
  } catch (e) {
    console.error("me GET failed", e);
    return NextResponse.json({ error: "Couldn't load your data." }, { status: 503 });
  }
}

const sameAnswers = (a: object | null, b: object | null) => {
  const strip = (p: object | null) => (p ? JSON.stringify({ ...p, workoutPlace: undefined }) : "");
  return strip(a) === strip(b);
};

export async function PATCH(req: Request) {
  const id = await clientId();
  if (!id) return unauth();
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const { users, clientdata, photos } = await cols();
    const user = await users.findOne({ _id: id });
    if (!user) return unauth();

    if (b.reset === true) {
      await Promise.all([clientdata.replaceOne({ _id: id }, freshData(id), { upsert: true }), photos.deleteMany({ userId: id })]);
      return NextResponse.json(await loadClient(id));
    }

    // Account fields. Once payments are on, the plan only changes by paying for it.
    const userSet: Record<string, unknown> = {};
    const u = b.user as Record<string, unknown> | undefined;
    if (u && validName(u.name)) userSet.name = (u.name as string).trim();
    if (u && validPlan(u.plan) && (accessOf(user) === "open" || !user.subscription)) userSet.plan = u.plan;
    if (Object.keys(userSet).length) await users.updateOne({ _id: id }, { $set: userSet });

    // Without a paid plan, only the account fields above can change.
    if (!hasAccess(user) && (b.profile !== undefined || b.days !== undefined || b.weights !== undefined || b.messages !== undefined)) {
      return NextResponse.json({ error: "Your plan isn't active. Complete payment to continue.", needsPayment: true }, { status: 402 });
    }

    const cur = (await clientdata.findOne({ _id: id })) ?? freshData(id);
    const set: Record<string, unknown> = {};
    const push: Record<string, unknown>[] = [];

    // Questionnaire. Changing answers sends the plan back to the coach; switching home/gym doesn't.
    if (b.profile !== undefined) {
      const profile = readProfile(b.profile);
      if (!profile) return NextResponse.json({ error: "Some answers are missing." }, { status: 400 });
      set.profile = profile;
      if (!sameAnswers(profile, cur.profile)) {
        set.planStatus = "review";
        if (!cur.weights.length) set.weights = [{ date: today(), kg: profile.weight }];
        push.push(cur.messages.length ? coachMessage("Thanks for updating your answers — I'm reworking your plan now.") : welcomeMessage(user.name));
      }
    }

    // Daily logs (meals ticked, swaps, water, steps, sets)
    if (b.days && typeof b.days === "object") {
      for (const [k, v] of Object.entries(b.days as Record<string, unknown>).slice(0, 14)) {
        const log = readDayLog(v);
        if (isDayKey(k) && log) set[`days.${k}`] = log;
      }
    }

    if (b.weights !== undefined && !set.weights) {
      const w = readWeights(b.weights);
      if (w) set.weights = w;
    }

    // New messages from the client to the coach
    if (Array.isArray(b.messages)) {
      for (const m of b.messages.slice(0, 5)) {
        const text = readText((m as Record<string, unknown>)?.text);
        const mid = (m as Record<string, unknown>)?.id;
        if (text) push.push({ id: typeof mid === "string" && /^[\w-]{4,40}$/.test(mid) ? mid : newId(), from: "me", text, at: Date.now() });
      }
    }

    const update: UpdateFilter<ClientDataDoc> = {};
    if (Object.keys(set).length) update.$set = set as UpdateFilter<ClientDataDoc>["$set"];
    if (push.length) update.$push = { messages: { $each: push } } as UpdateFilter<ClientDataDoc>["$push"];
    if (Object.keys(update).length) {
      // Make sure the document exists, then apply the field updates.
      const { _id, ...init } = freshData(id);
      void _id;
      await clientdata.updateOne({ _id: id }, { $setOnInsert: init }, { upsert: true });
      await clientdata.updateOne({ _id: id }, update);
    }
    return NextResponse.json(await loadClient(id));
  } catch (e) {
    console.error("me PATCH failed", e);
    return NextResponse.json({ error: "Couldn't save. Check your connection." }, { status: 503 });
  }
}
