import { Injectable } from '@nestjs/common';
import type {
  AiBotAccessState,
  AiBotsAccess,
} from '../../domain/AiIndexability';

const AI_BOTS = {
  gptBot: 'GPTBot',
  chatGptUser: 'ChatGPT-User',
  perplexityBot: 'PerplexityBot',
  claudeBot: 'ClaudeBot',
  googleExtended: 'Google-Extended',
} as const;

interface RobotsBlock {
  readonly ua: string;
  readonly disallowRoot: boolean;
}

@Injectable()
export class AiHeadersAnalyzerService {
  analyze(robotsTxt: string, headers: Record<string, string>): AiBotsAccess {
    const blocks = this.parseBlocks(robotsTxt);
    const robotsIsEmpty = robotsTxt.trim() === '';
    const decide = (uaName: string): AiBotAccessState => {
      const exact = blocks.find(
        (b) => b.ua.toLowerCase() === uaName.toLowerCase(),
      );
      if (exact) return exact.disallowRoot ? 'disallowed' : 'allowed';
      const wildcard = blocks.find((b) => b.ua === '*');
      if (wildcard) return wildcard.disallowRoot ? 'disallowed' : 'allowed';
      return robotsIsEmpty ? 'unknown' : 'allowed';
    };

    const xRobots = (headers['x-robots-tag'] || '').toLowerCase();
    return {
      gptBot: decide(AI_BOTS.gptBot),
      chatGptUser: decide(AI_BOTS.chatGptUser),
      perplexityBot: decide(AI_BOTS.perplexityBot),
      claudeBot: decide(AI_BOTS.claudeBot),
      googleExtended: decide(AI_BOTS.googleExtended),
      xRobotsNoAi: /\bnoai\b/.test(xRobots),
      xRobotsNoImageAi: /\bnoimageai\b/.test(xRobots),
    };
  }

  private parseBlocks(robots: string): RobotsBlock[] {
    const blocks: RobotsBlock[] = [];
    let current: { ua: string; disallowRoot: boolean } | null = null;
    for (const rawLine of robots.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const ua = /^User-agent:\s*(\S.*)$/i.exec(line);
      if (ua) {
        if (current) blocks.push(current);
        current = { ua: ua[1].trim(), disallowRoot: false };
        continue;
      }
      const dis = /^Disallow:\s*(\S.*)$/i.exec(line);
      if (dis && current && dis[1].trim() === '/') {
        current.disallowRoot = true;
      }
    }
    if (current) blocks.push(current);
    return blocks;
  }
}
