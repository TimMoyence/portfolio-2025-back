export function extractSitemapUrlsFromRobots(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const urls: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = /^sitemap\s*:\s*(\S+)$/i.exec(trimmed);
    if (!match) continue;
    urls.push(match[1].trim());
  }

  return Array.from(new Set(urls));
}
