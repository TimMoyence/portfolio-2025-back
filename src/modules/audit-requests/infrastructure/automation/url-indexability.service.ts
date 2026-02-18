import { Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { SafeFetchService } from './safe-fetch.service';

export interface UrlIndexabilityResult {
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  indexable: boolean;
  title?: string | null;
  metaDescription?: string | null;
  h1Count?: number;
  htmlLang?: string | null;
  robotsMeta: string | null;
  xRobotsTag: string | null;
  canonical: string | null;
  canonicalCount?: number;
  responseTimeMs?: number | null;
  error: string | null;
}

@Injectable()
export class UrlIndexabilityService {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly safeFetch: SafeFetchService,
  ) {}

  async analyzeUrls(urls: string[]): Promise<UrlIndexabilityResult[]> {
    if (urls.length === 0) return [];

    const concurrency = Math.min(
      this.config.urlAnalyzeConcurrency,
      Math.max(1, urls.length),
    );
    const results = Array<UrlIndexabilityResult>(urls.length);
    let cursor = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= urls.length) return;
        results[index] = await this.analyzeSingleUrl(urls[index]);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results;
  }

  private async analyzeSingleUrl(url: string): Promise<UrlIndexabilityResult> {
    try {
      const response = await this.safeFetch.fetchText(url);
      const html = response.body ?? '';
      const $ = load(html);
      const robotsMeta = $('meta[name="robots"]').attr('content') ?? null;
      const canonical = $('link[rel="canonical"]').attr('href') ?? null;
      const canonicalCount = $('link[rel="canonical"]').length;
      const title = $('title').first().text().trim() || null;
      const metaDescription =
        $('meta[name="description"]').attr('content')?.trim() ?? null;
      const h1Count = $('h1').length;
      const htmlLang = $('html').attr('lang')?.trim() ?? null;
      const xRobotsTag = response.headers['x-robots-tag'] ?? null;
      const loweredMeta = robotsMeta?.toLowerCase() ?? '';
      const loweredHeader = xRobotsTag?.toLowerCase() ?? '';
      const indexable =
        !loweredMeta.includes('noindex') && !loweredHeader.includes('noindex');

      return {
        url,
        finalUrl: response.finalUrl,
        statusCode: response.statusCode,
        indexable,
        title,
        metaDescription,
        h1Count,
        htmlLang,
        robotsMeta,
        xRobotsTag,
        canonical,
        canonicalCount,
        responseTimeMs: response.totalMs,
        error: null,
      };
    } catch (error) {
      return {
        url,
        finalUrl: null,
        statusCode: null,
        indexable: false,
        title: null,
        metaDescription: null,
        h1Count: 0,
        htmlLang: null,
        robotsMeta: null,
        xRobotsTag: null,
        canonical: null,
        canonicalCount: 0,
        responseTimeMs: null,
        error: String(error),
      };
    }
  }
}
