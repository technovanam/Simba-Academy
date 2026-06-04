/** `YYYY-MM-DD` for &lt;input type="date" min&gt; in local timezone. */
export function localDateInputMin(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDateTodayOrFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  const due = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() >= today.getTime();
}
