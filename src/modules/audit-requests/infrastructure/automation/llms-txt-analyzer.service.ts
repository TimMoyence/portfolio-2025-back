import { Injectable, Logger } from '@nestjs/common';
import type { LlmsTxtAnalysis } from '../../domain/AiIndexability';
import { SafeFetchService } from './safe-fetch.service';

/**
 * Service d'analyse du fichier `llms.txt` conforme à la spec
 * https://llmstxt.org. Télécharge le fichier via {@link SafeFetchService}
 * (protection SSRF), parse ses sections H2 et évalue un score de conformité.
 *
 * Le service ne lève jamais d'exception sur un site absent ou mal formé : il
 * retourne un résultat "absent" typé afin que le pipeline d'audit puisse
 * continuer son exécution en toute sécurité.
 */
@Injectable()
export class LlmsTxtAnalyzerService {
  private readonly logger = new Logger(LlmsTxtAnalyzerService.name);

  constructor(private readonly safeFetch: SafeFetchService) {}

  /**
   * Analyse la présence et la qualité du fichier `llms.txt` pour une origine
   * donnée (ex : `https://example.com`). Vérifie également la présence de la
   * variante `llms-full.txt`.
   */
  async analyze(origin: string): Promise<LlmsTxtAnalysis> {
    const cleanOrigin = origin.replace(/\/$/, '');
    const url = `${cleanOrigin}/llms.txt`;

    let body = '';
    try {
      const response = await this.safeFetch.fetchText(url);
      if (response.statusCode !== 200 || !response.body) {
        return this.absent(url);
      }
      body = response.body;
    } catch (error) {
      this.logger.warn(`llms.txt fetch failed for ${url}: ${String(error)}`);
      return this.absent(url);
    }

    const sections = this.parseSections(body);
    const hasFullVariant = await this.checkFullVariant(cleanOrigin);
    const issues: string[] = [];
    if (sections.length === 0) {
      issues.push('Aucune section H2 détectée');
    }
    if (!/^\s*>/m.test(body)) {
      issues.push('Pas de blockquote de description');
    }
    const complianceScore = this.score(
      sections,
      body.length,
      hasFullVariant,
      issues,
    );

    return {
      present: true,
      url,
      sizeBytes: body.length,
      sections,
      hasFullVariant,
      complianceScore,
      issues,
    };
  }

  private async checkFullVariant(cleanOrigin: string): Promise<boolean> {
    const url = `${cleanOrigin}/llms-full.txt`;
    try {
      const response = await this.safeFetch.fetchText(url);
      return response.statusCode === 200 && !!response.body;
    } catch (error) {
      this.logger.warn(
        `llms-full.txt fetch failed for ${url}: ${String(error)}`,
      );
      return false;
    }
  }

  private parseSections(
    body: string,
  ): ReadonlyArray<{ title: string; links: number }> {
    const lines = body.split(/\r?\n/);
    const sections: { title: string; links: number }[] = [];
    let current: { title: string; links: number } | null = null;
    for (const line of lines) {
      const h2 = /^##\s+(.+)$/.exec(line);
      if (h2) {
        if (current) sections.push(current);
        current = { title: h2[1].trim(), links: 0 };
        continue;
      }
      if (current && /^\s*-\s+\[.+\]\(.+\)/.test(line)) {
        current.links += 1;
      }
    }
    if (current) sections.push(current);
    return sections;
  }

  private score(
    sections: ReadonlyArray<{ title: string; links: number }>,
    size: number,
    hasFull: boolean,
    issues: ReadonlyArray<string>,
  ): number {
    let score = 40;
    if (sections.length > 0) score += 20;
    if (sections.some((s) => s.links > 0)) score += 15;
    if (hasFull) score += 15;
    if (size > 200) score += 10;
    score -= issues.length * 5;
    return Math.max(0, Math.min(100, score));
  }

  private absent(url: string): LlmsTxtAnalysis {
    return {
      present: false,
      url,
      sizeBytes: 0,
      sections: [],
      hasFullVariant: false,
      complianceScore: 0,
      issues: ['Fichier llms.txt absent'],
    };
  }
}
