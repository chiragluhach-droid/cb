/*
 * Admin › Subscriptions settings in the browser — prices, plan contents and
 * discount codes, stored in MongoDB via /api/settings.
 *
 * The root layout loads them on the server and primes this store
 * (<SettingsBoot>), so prices are right on first paint. The coach's edits show
 * instantly and save ~0.6s after typing stops.
 */

import { useEffect, useSyncExternalStore } from "react";
import { Settings, defaultSettings } from "@/lib/settings-core";

export * from "@/lib/settings-core";

let cache: Settings = defaultSettings;
let primed = false;
const listeners = new Set<() => void>();
const emit = (next: Settings) => {
  cache = next;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Called during render by <SettingsBoot> with the server's copy. */
export function primeSettings(s: Settings) {
  // On the server every request re-renders with fresh values; in the browser, prime once.
  if (typeof window === "undefined") {
    cache = s;
    return;
  }
  if (primed) return;
  primed = true;
  cache = s;
}

/** Fetch the latest copy (includes discount codes when the coach is signed in). */
export async function reloadSettings() {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) emit((await res.json()) as Settings);
  } catch {
    // keep what we have
  }
}

export function useSettings() {
  const s = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => {
    if (!primed) {
      primed = true;
      reloadSettings();
    }
  }, []);
  return s;
}

let timer: ReturnType<typeof setTimeout> | undefined;
export type SaveState = "idle" | "saving" | "saved" | "error";
let saveState: SaveState = "idle";
const saveListeners = new Set<() => void>();
const setSave = (s: SaveState) => {
  saveState = s;
  saveListeners.forEach((l) => l());
};
/** "saving" / "saved" / "error" for the coach's Subscriptions page. */
export const useSaveState = () =>
  useSyncExternalStore(
    (cb) => {
      saveListeners.add(cb);
      return () => saveListeners.delete(cb);
    },
    () => saveState,
    () => "idle" as SaveState
  );

async function put(s: Settings) {
  setSave("saving");
  try {
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (!res.ok) throw new Error(String(res.status));
    setSave("saved");
  } catch {
    setSave("error");
  }
}

/** Coach edit: show now, save shortly after typing stops. */
export function updateSettings(fn: (s: Settings) => Settings) {
  emit(fn(cache));
  setSave("saving");
  clearTimeout(timer);
  timer = setTimeout(() => put(cache), 600);
}

export function resetSettings() {
  clearTimeout(timer);
  emit(defaultSettings);
  put(defaultSettings);
}
