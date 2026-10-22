import { XMLParser } from 'fast-xml-parser';
import { estObjet } from '../../../../common/domain/est-objet';

export interface ParsedSitemap {
  urls: string[];
  sitemapUrls: string[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function readLoc(value: unknown): string | null {
  if (!estObjet(value)) return null;
  return typeof value.loc === 'string' ? value.loc.trim() : null;
}

function collectLocs(
  container: unknown,
  entryKey: string,
  maxUrls: number,
): Set<string> {
  const locs = new Set<string>();
  if (!estObjet(container)) return locs;

  const entries = asArray(container[entryKey]);
  for (const entry of entries) {
    const loc = readLoc(entry);
    if (loc) locs.add(loc);
    if (locs.size >= maxUrls) break;
  }
  return locs;
}

export function parseSitemapXml(
  xmlContent: string,
  maxUrls: number,
): ParsedSitemap {
  const parsed = parser.parse(xmlContent) as Record<string, unknown>;
  const urls = collectLocs(parsed.urlset, 'url', maxUrls);
  const sitemapUrls = collectLocs(parsed.sitemapindex, 'sitemap', maxUrls);

  return {
    urls: Array.from(urls).slice(0, maxUrls),
    sitemapUrls: Array.from(sitemapUrls).slice(0, maxUrls),
  };
}
