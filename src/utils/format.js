export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function formatMinutes(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}m`;
}
