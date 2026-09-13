// Linear proportional scaling (GPA/10 * 4), not a piecewise lookup table.
// Different universities and scholarship boards (WES, individual admissions
// offices) publish different piecewise 10-to-4 tables with no single
// authoritative standard, so a piecewise table here would carry false
// precision. Linear scaling is transparent, always defensible as an
// estimate, and matches what most consultancies quote as a first
// approximation — the UI must still tell the user to verify with an official
// evaluation (WES, or the target school) before relying on it for a real
// application.
export function convertGpa10To4(gpa10) {
  const n = Number(gpa10);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.min(10, Math.max(0, n));
  return Math.round((clamped / 10) * 4 * 100) / 100;
}
