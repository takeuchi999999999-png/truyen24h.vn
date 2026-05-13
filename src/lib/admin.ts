/**
 * Admin utility functions
 * Centralized admin check — replaces all hardcoded email comparisons
 */

const ADMIN_EMAILS: string[] = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

/**
 * Check if a given email is an admin
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get admin badges to append to user profile
 */
export function getAdminBadges(): string[] {
  return ['VIP', 'Admin'];
}
