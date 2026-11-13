"use client";

import { primeSettings, type Settings } from "@/lib/settings";

/** Hands the server's settings to the browser store before any page content renders. */
export default function SettingsBoot({ initial }: { initial: Settings }) {
  primeSettings(initial);
  return null;
}
