// All "days" are Indian Standard Time days
export function istDate(d = new Date()) {
  return new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
export function weekdayIndex(d = new Date()) {
  // Mon = 0 … Sun = 6, in IST
  const day = new Date(d.getTime() + 5.5 * 3600 * 1000).getUTCDay();
  return (day + 6) % 7;
}
