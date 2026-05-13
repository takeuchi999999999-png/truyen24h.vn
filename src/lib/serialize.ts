/**
 * Convert Firestore Timestamps (or any non-plain values) into JSON-safe
 * primitives so server components can pass `novel` and `chapter` props
 * to client components without Next.js complaining about un-serializable
 * payloads.
 *
 * Why: when we write `createdAt: serverTimestamp()` via the admin SDK
 * and later read with the client SDK, the field comes back as a
 * `Timestamp` class instance. Server components serialize props as JSON;
 * class instances become `{}` or throw, leaving the client component
 * stuck on `loading.tsx`. This helper preempts that by mapping anything
 * with `.toMillis()` into a millis number.
 */
export function serializeFirestore<T = any>(value: any): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  // Firestore Timestamp from either client or admin SDK has .toMillis().
  if (typeof value.toMillis === 'function') {
    return value.toMillis() as unknown as T;
  }
  // GeoPoint (rare for us) — convert to {lat, lng}.
  if (typeof value.latitude === 'number' && typeof value.longitude === 'number' &&
      Object.keys(value).length === 2) {
    return { lat: value.latitude, lng: value.longitude } as unknown as T;
  }
  // Array
  if (Array.isArray(value)) {
    return value.map((v) => serializeFirestore(v)) as unknown as T;
  }
  // Plain object
  const out: Record<string, any> = {};
  for (const k of Object.keys(value)) {
    out[k] = serializeFirestore(value[k]);
  }
  return out as T;
}
