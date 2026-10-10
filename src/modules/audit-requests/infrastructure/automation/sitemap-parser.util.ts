import { XMLParser } from 'fast-xml-parser';
import { randomInt } from 'node:crypto';
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

export function pickUrlSample(
  urls: string[],
  sampleSize: number,
  analyzeLimit: number,
): { sample: string[]; deepAnalysis: string[] } {
  const uniqueUrls = Array.from(new Set(urls));
  if (uniqueUrls.length === 0) {
    return { sample: [], deepAnalysis: [] };
  }

  const sample = pickWithHeadAndRandom(uniqueUrls, sampleSize);
  const deepAnalysis = pickWithHeadAndRandom(uniqueUrls, analyzeLimit);
  return { sample, deepAnalysis };
}

function pickWithHeadAndRandom(urls: string[], limit: number): string[] {
  if (limit <= 0) return [];
  if (urls.length <= limit) return [...urls];

  const safeLimit = Math.min(limit, urls.length);
  const headCount = Math.max(1, Math.ceil(safeLimit * 0.5));
  const head = urls.slice(0, headCount);
  const tail = urls.slice(headCount);
  const randomTail = sampleRandom(tail, safeLimit - headCount);

  return [...head, ...randomTail];
}

function sampleRandom(values: string[], count: number): string[] {
  if (count <= 0 || values.length === 0) return [];
  if (values.length <= count) return [...values];

  const list = [...values];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}
