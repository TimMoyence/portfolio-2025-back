import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { extractSitemapUrlsFromRobots } from './robots-sitemap-discovery.util';
import { parseSitemapXml } from './sitemap-parser.util';
import { SafeFetchService } from './safe-fetch.service';

export interface SitemapDiscoveryResult {
  sitemapUrls: string[];
  urls: string[];
}

@Injectable()
export class SitemapDiscoveryService {
  private readonly logger = new Logger(SitemapDiscoveryService.name);

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly safeFetch: SafeFetchService,
  ) {}

  async discover(baseUrl: string): Promise<SitemapDiscoveryResult> {
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;

    const candidates = new Set<string>();
    const discoveredSitemaps = new Set<string>();
    const discoveredUrls = new Set<string>();

    try {
      const robotsResponse = await this.safeFetch.fetchText(
        robotsUrl,
        this.config.textMaxBytes,
      );
      if (robotsResponse.statusCode < 400 && robotsResponse.body) {
        for (const raw of extractSitemapUrlsFromRobots(robotsResponse.body)) {
          const absolute = new URL(raw, origin).toString();
          candidates.add(absolute);
        }
      }
    } catch (error) {
      this.logger.warn(
        `robots.txt discovery failed for ${origin}: ${String(error)}`,
      );
    }

    candidates.add(`${origin}/sitemap.xml`);

    const queue = Array.from(candidates);
    const visited = new Set<string>();

    while (
      queue.length > 0 &&
      visited.size < 100 &&
      discoveredUrls.size < this.config.sitemapMaxUrls
    ) {
      const sitemapUrl = queue.shift();
      if (!sitemapUrl || visited.has(sitemapUrl)) continue;
      visited.add(sitemapUrl);
      discoveredSitemaps.add(sitemapUrl);

      try {
        const sitemapResponse = await this.safeFetch.fetchText(
          sitemapUrl,
          this.config.textMaxBytes,
        );

        if (sitemapResponse.statusCode >= 400 || !sitemapResponse.body) {
          continue;
        }

        const parsed = parseSitemapXml(
          sitemapResponse.body,
          this.config.sitemapMaxUrls,
        );

        for (const url of parsed.urls) {
          if (discoveredUrls.size >= this.config.sitemapMaxUrls) break;
          discoveredUrls.add(url);
        }

        for (const nestedSitemap of parsed.sitemapUrls) {
          if (visited.has(nestedSitemap)) continue;
          queue.push(new URL(nestedSitemap, sitemapUrl).toString());
        }
      } catch (error) {
        this.logger.warn(
          `Failed to parse sitemap ${sitemapUrl}: ${String(error)}`,
        );
      }
    }

    return {
      sitemapUrls: Array.from(discoveredSitemaps),
      urls: Array.from(discoveredUrls).slice(0, this.config.sitemapMaxUrls),
    };
  }
}
