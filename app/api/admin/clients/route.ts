import { NextResponse } from "next/server";
import { allRecipes, loadAllClients } from "@/lib/server/repo";
import { isAdmin } from "@/lib/server/session";

/** GET /api/admin/clients — every client with their dashboard data (coach only). */

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Coach sign-in required." }, { status: 401 });
  try {
    const [clients, recipes] = await Promise.all([loadAllClients(), allRecipes()]);
    return NextResponse.json({ clients, recipes });
  } catch (e) {
    console.error("admin clients failed", e);
    return NextResponse.json({ error: "Couldn't load clients." }, { status: 503 });
  }
}
