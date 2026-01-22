/**
 * Calculate the number of days until a given expiry date
 * @param expiresAt - ISO date string
 * @returns Number of days until expiry (0 if expired, positive if future)
 */
export function getDaysTillExpiry(expiresAt: string): number {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
