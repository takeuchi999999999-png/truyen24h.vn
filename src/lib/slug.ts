/**
 * Vietnamese-aware URL slugifier shared by novel + blog publishers.
 * Strips diacritics (NFD + combining mark range), maps đ/Đ → d/D,
 * keeps only [a-z0-9], collapses runs into single dashes.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Adds a short random suffix so two posts with the same title don't collide.
 */
export function slugifyWithSuffix(input: string): string {
  const base = slugify(input);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}
