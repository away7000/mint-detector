export function getScore({ hasTwitter, hasDiscord, burst }) {
  let score = 0;

  if (hasTwitter) score += 30;
  if (hasDiscord) score += 20;
  if (burst >= 3) score += 30;
  if (burst >= 6) score += 20;

  return score;
}

export function getVerdict(score) {
  if (score >= 70) return "🔥 STRONG";
  if (score >= 40) return "⚠️ MID";
  return "❌ WEAK";
}
