import { Inject, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import { assertSafeHttpUrl } from './ssrf-guard.util';
import type { AuditAutomationConfig } from './audit.config';

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export interface SafeFetchResult {
  requestedUrl: string;
  finalUrl: string;
  redirectChain: string[];
  statusCode: number;
  headers: Record<string, string>;
  body: string | null;
  ttfbMs: number;
  totalMs: number;
  contentLength: number | null;
}

@Injectable()
export class SafeFetchService {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {}

  async fetchText(
    url: string,
    maxBytes: number = this.config.textMaxBytes,
  ): Promise<SafeFetchResult> {
    return this.fetchInternal(url, true, maxBytes);
  }

  async fetchHeaders(url: string): Promise<SafeFetchResult> {
    return this.fetchInternal(url, false, 0);
  }

  private async fetchInternal(
    targetUrl: string,
    readBody: boolean,
    maxBytes: number,
  ): Promise<SafeFetchResult> {
    const redirectChain: string[] = [];
    let currentUrl = new URL(targetUrl);
    let finalResponse: SafeFetchResult | null = null;
    const globalStart = performance.now();

    for (let hop = 0; hop <= this.config.maxRedirects; hop += 1) {
      await assertSafeHttpUrl(currentUrl);
      const hopStart = performance.now();

      const response = await this.fetchOnce(currentUrl.toString());
      const ttfbMs = performance.now() - hopStart;
      const headers = this.normalizeHeaders(response.headers);
      const contentLength = this.parseContentLength(headers['content-length']);

      if (REDIRECT_STATUS_CODES.has(response.status) && headers.location) {
        redirectChain.push(currentUrl.toString());
        currentUrl = new URL(headers.location, currentUrl);
        continue;
      }

      const body = readBody
        ? await this.readBodyWithLimit(response, maxBytes)
        : null;

      finalResponse = {
        requestedUrl: targetUrl,
        finalUrl: currentUrl.toString(),
        redirectChain,
        statusCode: response.status,
        headers,
        body,
        ttfbMs,
        totalMs: performance.now() - globalStart,
        contentLength,
      };
      break;
    }

    if (!finalResponse) {
      throw new Error(
        `Too many redirects (>${this.config.maxRedirects}) for ${targetUrl}`,
      );
    }

    return finalResponse;
  }

  private async fetchOnce(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.fetchTimeoutMs);

    try {
      return await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent':
            'AsiliAuditBot/1.0 (+https://asilidesign.fr; contact=admin@asilidesign.fr)',
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async readBodyWithLimit(
    response: Response,
    maxBytes: number,
  ): Promise<string> {
    if (!response.body) {
      return '';
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let total = 0;
    const chunks: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error(`Response body exceeds max allowed size (${maxBytes})`);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }

    chunks.push(decoder.decode());
    return chunks.join('');
  }

  private normalizeHeaders(headers: Headers): Record<string, string> {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
    return normalized;
  }

  private parseContentLength(raw: string | undefined): number | null {
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
