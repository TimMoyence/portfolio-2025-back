import { AiHeadersAnalyzerService } from './ai-headers-analyzer.service';

describe('AiHeadersAnalyzerService', () => {
  const service = new AiHeadersAnalyzerService();

  it('détecte GPTBot disallowed dans robots.txt', () => {
    const robots = 'User-agent: GPTBot\nDisallow: /\n';
    const result = service.analyze(robots, {});
    expect(result.gptBot).toBe('disallowed');
  });

  it('détecte PerplexityBot allowed par défaut (wildcard Allow)', () => {
    const robots = 'User-agent: *\nAllow: /\n';
    const result = service.analyze(robots, {});
    expect(result.perplexityBot).toBe('allowed');
  });

  it('détecte X-Robots-Tag: noai', () => {
    const result = service.analyze('', { 'x-robots-tag': 'noai' });
    expect(result.xRobotsNoAi).toBe(true);
    expect(result.xRobotsNoImageAi).toBe(false);
  });

  it('détecte X-Robots-Tag: noimageai', () => {
    const result = service.analyze('', { 'x-robots-tag': 'noimageai' });
    expect(result.xRobotsNoImageAi).toBe(true);
  });

  it('détecte Google-Extended disallowed', () => {
    const robots = 'User-agent: Google-Extended\nDisallow: /\n';
    const result = service.analyze(robots, {});
    expect(result.googleExtended).toBe('disallowed');
  });

  it('retourne unknown quand robots.txt vide et headers absents', () => {
    const result = service.analyze('', {});
    expect(result.gptBot).toBe('unknown');
    expect(result.chatGptUser).toBe('unknown');
    expect(result.perplexityBot).toBe('unknown');
    expect(result.claudeBot).toBe('unknown');
    expect(result.googleExtended).toBe('unknown');
    expect(result.xRobotsNoAi).toBe(false);
    expect(result.xRobotsNoImageAi).toBe(false);
  });

  it('ignore les commentaires et lignes vides', () => {
    const robots = '# header comment\n\nUser-agent: ClaudeBot\nDisallow: /\n';
    const result = service.analyze(robots, {});
    expect(result.claudeBot).toBe('disallowed');
  });

  it('fallback sur le wildcard si aucune règle spécifique', () => {
    const robots = 'User-agent: *\nDisallow: /\n';
    const result = service.analyze(robots, {});
    expect(result.gptBot).toBe('disallowed');
    expect(result.claudeBot).toBe('disallowed');
  });

  it('retourne allowed quand un bloc spécifique existe sans Disallow: /', () => {
    const robots = 'User-agent: ChatGPT-User\nDisallow: /admin\n';
    const result = service.analyze(robots, {});
    expect(result.chatGptUser).toBe('allowed');
  });

  it('retourne allowed par défaut quand robots.txt non vide sans match', () => {
    const robots = 'User-agent: Bingbot\nDisallow: /private\n';
    const result = service.analyze(robots, {});
    // Pas de bloc GPTBot, pas de wildcard → robots non vide → allowed
    expect(result.gptBot).toBe('allowed');
  });

  it('gère la détection case-insensitive des user-agents', () => {
    const robots = 'User-agent: gptbot\nDisallow: /\n';
    const result = service.analyze(robots, {});
    expect(result.gptBot).toBe('disallowed');
  });

  it('parse correctement plusieurs blocs successifs', () => {
    const robots = [
      'User-agent: GPTBot',
      'Disallow: /',
      'User-agent: ClaudeBot',
      'Disallow: /private',
      'User-agent: PerplexityBot',
      'Disallow: /',
    ].join('\n');
    const result = service.analyze(robots, {});
    expect(result.gptBot).toBe('disallowed');
    expect(result.claudeBot).toBe('allowed');
    expect(result.perplexityBot).toBe('disallowed');
  });

  it('combine noai et noimageai dans le header', () => {
    const result = service.analyze('', {
      'x-robots-tag': 'noai, noimageai',
    });
    expect(result.xRobotsNoAi).toBe(true);
    expect(result.xRobotsNoImageAi).toBe(true);
  });
});
