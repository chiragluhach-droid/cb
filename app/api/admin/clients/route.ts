import { NextResponse } from "next/server";
import { cols } from "@/lib/server/mongo";
import { allRecipes, loadAllClients } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";

/**
 * GET /api/admin/clients — every client with their dashboard data, plus "leads":
 * people who left their details at the end of the questionnaire but never
 * confirmed their email (coach only).
 */

async function loadLeads() {
  const { leads } = await cols();
  const list = await leads.find({}).sort({ updatedAt: -1 }).limit(500).toArray();
  return list.map(({ _id, ...l }) => ({ email: _id, ...l }));
}

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  try {
    const [clients, recipes, leads] = await Promise.all([loadAllClients(), allRecipes(), loadLeads()]);
    return NextResponse.json({ clients, recipes, leads });
  } catch (e) {
    console.error("admin clients failed", e);
    return NextResponse.json({ error: "Couldn't load clients." }, { status: 503 });
  }
}
