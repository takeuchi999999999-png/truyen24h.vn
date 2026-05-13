/**
 * API-route auth helpers.
 *
 * Two ways to authorize an admin API call:
 *   1. Internal cron — header `x-admin-token` matches ADMIN_API_TOKEN env.
 *   2. Logged-in admin — the client passes `x-admin-email` (read from
 *      Firebase Auth on the client) and we check it against the
 *      NEXT_PUBLIC_ADMIN_EMAILS whitelist.
 *
 * The token path is for the scheduled-task / cron pipeline; the email
 * path is for the in-app admin dashboard.
 */
import { NextRequest } from 'next/server';
import { isAdmin } from './admin';

export interface AuthResult {
  ok: boolean;
  reason?: string;
  via?: 'token' | 'email';
  email?: string;
}

export function authorizeAdmin(req: NextRequest): AuthResult {
  const token = req.headers.get('x-admin-token');
  const expected = process.env.ADMIN_API_TOKEN;
  if (token && expected && token === expected) {
    return { ok: true, via: 'token' };
  }

  const email = req.headers.get('x-admin-email');
  if (email && isAdmin(email)) {
    return { ok: true, via: 'email', email };
  }

  return { ok: false, reason: 'Unauthorized' };
}
