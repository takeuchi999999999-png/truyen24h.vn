/**
 * AI Cover image generation.
 *
 * Strategy:
 *   1. Pollinations.ai — free, no API key, returns image directly from URL.
 *      We just build a URL with the prompt and Firestore stores that URL.
 *      Pollinations caches by seed so the same prompt = same image.
 *   2. Future: switch to Gemini Image Preview or paid Stability/Imagen
 *      by changing one function below.
 *
 * Why URL-based instead of binary upload?
 *   - Zero storage cost.
 *   - Pollinations serves through their CDN, OK for Vietnamese readers.
 *   - If their CDN goes down we can swap to another provider by editing
 *     this file only — Firestore data stays valid because we store
 *     the full URL (not a Pollinations-specific key).
 */

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt/';

/**
 * Build a deterministic cover URL from a prompt.
 *
 * @param prompt - English-language image description from generateNovelOutline.
 * @param opts.width - default 600 (book-cover aspect ratio with 900h)
 * @param opts.height - default 900
 * @param opts.seed - keep stable per novel so reloads don't re-roll the image
 */
export function buildCoverUrl(prompt: string, opts: {
  width?: number;
  height?: number;
  seed?: number;
  model?: string;
  nologo?: boolean;
} = {}): string {
  const width = opts.width ?? 600;
  const height = opts.height ?? 900;
  const seed = opts.seed ?? hashSeed(prompt);
  const model = opts.model ?? 'flux'; // Pollinations supports: flux, turbo, dalle3
  const nologo = opts.nologo ?? true;

  // Tag the prompt with style cues that work well for fiction covers.
  const enriched = [
    prompt,
    'book cover illustration',
    'vivid colors',
    'centered subject',
    'professional digital art',
    'no text, no letters, no watermark',
  ].join(', ');

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model,
    ...(nologo ? { nologo: 'true' } : {}),
  });

  return `${POLLINATIONS_BASE}${encodeURIComponent(enriched)}?${params.toString()}`;
}

/**
 * Build a wide banner URL (16:9) for the same novel.
 */
export function buildBannerUrl(prompt: string, seedSource: string): string {
  return buildCoverUrl(prompt + ', cinematic wide shot, landscape orientation', {
    width: 1280,
    height: 720,
    seed: hashSeed(seedSource + '|banner'),
  });
}

/**
 * Stable 31-bit hash for deterministic seeding.
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // keep positive
}
