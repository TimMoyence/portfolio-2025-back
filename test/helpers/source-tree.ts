import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export function collectFiles(root: string): string[] {
  const output: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return output;
  }

  for (const entry of entries) {
    const absolute = join(root, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      output.push(...collectFiles(absolute));
      continue;
    }

    output.push(absolute);
  }

  return output;
}
