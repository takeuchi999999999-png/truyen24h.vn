/**
 * Firebase Admin SDK initialization (server-side only).
 *
 * Admin SDK has full read/write access to Firestore and bypasses all
 * Security Rules. We use it from API routes so the AI-publishing pipeline,
 * cron jobs, and revenue dashboards don't need to fake user auth.
 *
 * Setup:
 *   1. Firebase Console → Project Settings → Service Accounts → Generate
 *      new private key. Downloads a JSON file.
 *   2. Set the JSON contents as env var FIREBASE_SERVICE_ACCOUNT_JSON
 *      on Vercel (tick "Sensitive"). Multiline is fine.
 *   3. Optional: also accept GOOGLE_APPLICATION_CREDENTIALS pointing at a
 *      file path (useful in CI/CD).
 *
 * The module deduplicates initialization so multiple route imports share
 * one App instance (Firebase requirement).
 */
import { cert, getApps, initializeApp, type App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _db: Firestore | null = null;

function init(): App {
  if (_app) return _app;

  const existing = getApps();
  if (existing.length) {
    _app = existing[0];
    return _app;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    let parsed: any;
    try {
      // Vercel sometimes wraps multiline JSON in quotes — strip them if so.
      parsed = JSON.parse(json.trim().replace(/^['"]|['"]$/g, ''));
    } catch (e) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full file contents (curly braces included).'
      );
    }
    // Some Vercel pastes escape \n as literal "\n" in private_key — un-escape.
    if (parsed.private_key && parsed.private_key.includes('\\n')) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    _app = initializeApp({
      credential: cert(parsed),
      projectId: parsed.project_id,
    });
    return _app;
  }

  // Fall back to GOOGLE_APPLICATION_CREDENTIALS / metadata server.
  _app = initializeApp({ credential: applicationDefault() });
  return _app;
}

/**
 * Lazy-initialized admin Firestore. Throws a clear error if creds are
 * missing so API routes can return a useful 500 with diagnostic info.
 */
export function adminDb(): Firestore {
  if (_db) return _db;
  init();
  _db = getFirestore();
  return _db;
}

/**
 * Re-export common server timestamp helper from the admin SDK so callers
 * can write `serverTimestamp()` without importing two modules.
 */
import { FieldValue } from 'firebase-admin/firestore';
export const serverTimestamp = () => FieldValue.serverTimestamp();
export { FieldValue };
