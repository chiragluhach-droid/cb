/*
 * Reads and shapes database records for the API — SERVER ONLY.
 * Output matches the types the screens already use (lib/demo-store.ts).
 */

import { randomBytes } from "crypto";
import type { Message, User, UserData } from "@/lib/demo-store";
import { Settings, defaultSettings } from "@/lib/settings-core";
import { ClientDataDoc, UserDoc, cols } from "@/lib/server/mongo";

export const newId = () => randomBytes(9).toString("base64url");

export const today = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const toUser = (u: UserDoc): User => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, plan: u.plan, createdAt: u.createdAt });

export const freshData = (id: string): ClientDataDoc => ({
  _id: id,
  profile: null,
  planStatus: "none",
  startDate: today(),
  days: {},
  weights: [],
  messages: [],
});

export const coachMessage = (text: string): Message => ({ id: newId(), from: "coach", text, at: Date.now() });

export const welcomeMessage = (name: string) =>
  coachMessage(`Hi ${name.split(" ")[0]}! I'm your Evowell coach. I've got your answers and I'm reviewing your first plan now — you'll see it in Today shortly. Ask me anything here.`);

/** Photos are served from /api/photos/:id, so the data never travels in JSON. */
async function photoList(userIds: string[]) {
  const { photos } = await cols();
  const rows = await photos.find({ userId: { $in: userIds } }, { projection: { data: 0 } }).sort({ date: -1, createdAt: -1 }).toArray();
  const by = new Map<string, UserData["photos"]>();
  for (const p of rows) {
    const list = by.get(p.userId) ?? [];
    list.push({ id: p._id, date: p.date, src: `/api/photos/${p._id}` });
    by.set(p.userId, list);
  }
  return by;
}

const toData = (d: ClientDataDoc | null, id: string, photos: UserData["photos"] = []): UserData => {
  const { _id, ...rest } = d ?? freshData(id);
  void _id;
  return { ...rest, photos };
};

export async function loadClient(id: string): Promise<{ user: User; data: UserData } | null> {
  const { users, clientdata } = await cols();
  const u = await users.findOne({ _id: id });
  if (!u) return null;
  const [d, photos] = await Promise.all([clientdata.findOne({ _id: id }), photoList([id])]);
  return { user: toUser(u), data: toData(d, id, photos.get(id)) };
}

export async function loadAllClients() {
  const { users, clientdata } = await cols();
  const us = await users.find({ role: "client" }).sort({ createdAt: -1 }).toArray();
  const ids = us.map((u) => u._id);
  const [ds, photos] = await Promise.all([clientdata.find({ _id: { $in: ids } }).toArray(), photoList(ids)]);
  const byId = new Map(ds.map((d) => [d._id, d]));
  return us.map((u) => ({ user: toUser(u), data: toData(byId.get(u._id) ?? null, u._id, photos.get(u._id)) }));
}

let settingsCache: { at: number; value: Settings } | null = null;
export const clearSettingsCache = () => {
  settingsCache = null;
};

export async function getSettings(): Promise<Settings> {
  if (settingsCache && Date.now() - settingsCache.at < 30000) return settingsCache.value;
  const value = await readSettingsDoc();
  settingsCache = { at: Date.now(), value };
  return value;
}

async function readSettingsDoc(): Promise<Settings> {
  try {
    const { settings } = await cols();
    const s = await settings.findOne({ _id: "subscriptions" });
    if (!s) return defaultSettings;
    const { _id, ...rest } = s;
    void _id;
    return { ...defaultSettings, ...rest, plans: { ...defaultSettings.plans, ...rest.plans } };
  } catch {
    return defaultSettings; // site keeps working with default prices if the database is unreachable
  }
}
