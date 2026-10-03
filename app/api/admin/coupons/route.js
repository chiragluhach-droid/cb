import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  const [, err] = await requireUser({ admin: true });
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || "").toUpperCase().trim();
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return bad("Code: 3–20 letters/numbers");
  if (!(+b.percentOff > 0) && !(+b.flatOff > 0)) return bad("Set a % or flat discount");
  if (await Coupon.exists({ code })) return bad("That code exists");
  const c = await Coupon.create({ code, percentOff: Math.min(100, +b.percentOff || 0), flatOff: +b.flatOff || 0, maxUses: +b.maxUses || 0, expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined });
  return NextResponse.json({ ok: true, coupon: c });
}
