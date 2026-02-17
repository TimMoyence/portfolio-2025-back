import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { SafeFetchService } from './safe-fetch.service';

export interface UrlIndexabilityResult {
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  indexable: boolean;
  robotsMeta: string | null;
  xRobotsTag: string | null;
  canonical: string | null;
  error: string | null;
}

@Injectable()
export class UrlIndexabilityService {
  constructor(private readonly safeFetch: SafeFetchService) {}

  async analyzeUrls(urls: string[]): Promise<UrlIndexabilityResult[]> {
    const results: UrlIndexabilityResult[] = [];

    for (const url of urls) {
      try {
        const response = await this.safeFetch.fetchText(url);
        const html = response.body ?? '';
        const $ = load(html);
        const robotsMeta = $('meta[name="robots"]').attr('content') ?? null;
        const canonical = $('link[rel="canonical"]').attr('href') ?? null;
        const xRobotsTag = response.headers['x-robots-tag'] ?? null;
        const loweredMeta = robotsMeta?.toLowerCase() ?? '';
        const loweredHeader = xRobotsTag?.toLowerCase() ?? '';
        const indexable =
          !loweredMeta.includes('noindex') &&
          !loweredHeader.includes('noindex');

        results.push({
          url,
          finalUrl: response.finalUrl,
          statusCode: response.statusCode,
          indexable,
          robotsMeta,
          xRobotsTag,
          canonical,
          error: null,
        });
      } catch (error) {
        results.push({
          url,
          finalUrl: null,
          statusCode: null,
          indexable: false,
          robotsMeta: null,
          xRobotsTag: null,
          canonical: null,
          error: String(error),
        });
      }
    }

    return results;
  }
}
