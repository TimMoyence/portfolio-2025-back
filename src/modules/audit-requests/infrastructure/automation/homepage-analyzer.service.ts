import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { SafeFetchResult } from './safe-fetch.service';
import {
  lireReponseTechnique,
  lireSignauxDePage,
  type ReponseTechnique,
  type SignauxDePage,
} from './shared/html-signals.util';

export type HomepageAuditSnapshot = ReponseTechnique & SignauxDePage;

@Injectable()
export class HomepageAnalyzerService {
  analyze(fetchResult: SafeFetchResult): HomepageAuditSnapshot {
    const html = fetchResult.body ?? '';
    return {
      ...lireReponseTechnique(fetchResult),
      ...lireSignauxDePage(load(html), html, fetchResult.finalUrl),
    };
  }
}
