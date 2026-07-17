// zalo.me deep links use the phone number in "84xxxxxxxxx" form (no leading
// 0, no "+"). Admin just types a normal Vietnamese phone number in Settings
// (e.g. "0393002410") — this normalizes it so the link actually opens a chat
// instead of a broken/blank Zalo page.
export function buildZaloLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `84${digits.slice(1)}` : digits;
  return `https://zalo.me/${normalized}`;
}
