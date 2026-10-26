/** Copies text to the clipboard. Resolves false if the browser blocks it. */
export async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
}
