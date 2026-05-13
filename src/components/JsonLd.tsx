/**
 * Structured-data (Schema.org JSON-LD) components.
 *
 * Google rewards content sites that ship rich, accurate JSON-LD with
 * higher CTR (rich results), better topic clustering, and faster
 * discovery of new chapters. These components render a single
 * <script type="application/ld+json"> tag — completely passive,
 * no JavaScript runs on the client.
 */
import { absoluteUrl, SITE_NAME, SITE_LOGO_PATH, SITE_DESCRIPTION } from '@/lib/site';

type Json = Record<string, unknown>;

function renderJsonLd(data: Json) {
  // We intentionally use dangerouslySetInnerHTML — JSON.stringify is safe
  // because Schema.org JSON-LD is a string-only payload and we control all keys.
  return (
    <script
      type="application/ld+json"
      // The </script> escape avoids the rare edge case where a string in
      // content contains "</script>" and breaks the closing tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

/* ---------------- Organization / WebSite (use in root layout) ---------------- */

export function OrganizationJsonLd() {
  const data: Json = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl(SITE_LOGO_PATH),
    sameAs: [
      // anh paste link Fanpage / TikTok / YouTube ở đây để tăng tín hiệu E-E-A-T
      // 'https://www.facebook.com/truyen24h.vn',
      // 'https://www.tiktok.com/@truyen24h.vn',
    ],
    description: SITE_DESCRIPTION,
  };
  return renderJsonLd(data);
}

export function WebSiteJsonLd() {
  const data: Json = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'vi-VN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/tim-kiem')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  return renderJsonLd(data);
}

/* ---------------- Novel (Book) ---------------- */

interface NovelLike {
  id: string;
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genres?: string[];
  status?: string;
  rating?: number;
  views?: string | number;
  createdAt?: { toMillis?: () => number } | number;
  updatedAt?: { toMillis?: () => number } | number;
}

function toIso(value: NovelLike['createdAt']): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') return new Date(value).toISOString();
  const ms = (value as any).toMillis?.();
  return ms ? new Date(ms).toISOString() : undefined;
}

export function NovelJsonLd({ novel }: { novel: NovelLike }) {
  const url = absoluteUrl(`/truyen/${novel.id}`);
  const data: Json = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': url,
    name: novel.title,
    bookFormat: 'https://schema.org/EBook',
    inLanguage: 'vi-VN',
    url,
    image: novel.coverUrl || undefined,
    description: novel.description,
    author: novel.author
      ? { '@type': 'Person', name: novel.author }
      : undefined,
    genre: Array.isArray(novel.genres) && novel.genres.length ? novel.genres : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl(SITE_LOGO_PATH) },
    },
    datePublished: toIso(novel.createdAt),
    dateModified: toIso(novel.updatedAt),
    aggregateRating:
      typeof novel.rating === 'number' && novel.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: novel.rating,
            bestRating: 5,
            ratingCount: typeof novel.views === 'number' ? novel.views : 1,
          }
        : undefined,
  };
  // strip undefined
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const breadcrumb: Json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Truyện', item: absoluteUrl('/tim-kiem') },
      { '@type': 'ListItem', position: 3, name: novel.title, item: url },
    ],
  };

  return (
    <>
      {renderJsonLd(data)}
      {renderJsonLd(breadcrumb)}
    </>
  );
}

/* ---------------- Chapter (Article) ---------------- */

interface ChapterLike {
  id: string;
  title?: string;
  chapterNumber?: number;
  content?: string;
  publishDate?: { toMillis?: () => number } | number;
}

export function ChapterJsonLd({
  novel,
  chapter,
}: {
  novel: NovelLike;
  chapter: ChapterLike;
}) {
  const novelUrl = absoluteUrl(`/truyen/${novel.id}`);
  const url = absoluteUrl(`/doc/${novel.id}/${chapter.id}`);
  const wordCount = chapter.content ? chapter.content.trim().split(/\s+/).length : undefined;

  const data: Json = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    '@id': url,
    name: `Chương ${chapter.chapterNumber}: ${chapter.title}`,
    url,
    isPartOf: { '@type': 'Book', '@id': novelUrl, name: novel.title, url: novelUrl },
    position: chapter.chapterNumber,
    wordCount,
    datePublished: toIso(chapter.publishDate),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl(SITE_LOGO_PATH) },
    },
    inLanguage: 'vi-VN',
    image: novel.coverUrl || undefined,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const breadcrumb: Json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: novel.title, item: novelUrl },
      { '@type': 'ListItem', position: 3, name: `Chương ${chapter.chapterNumber}`, item: url },
    ],
  };

  return (
    <>
      {renderJsonLd(data)}
      {renderJsonLd(breadcrumb)}
    </>
  );
}
