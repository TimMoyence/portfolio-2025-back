import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

function collectFiles(root: string): string[] {
  const output: string[] = [];
  const entries = readdirSync(root);

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

describe('Cross-context naming coherence', () => {
  const modulesRoot = join(process.cwd(), 'src/modules');
  const files = collectFiles(modulesRoot);

  it('uses `token.ts` consistently (no `Token.ts` remain)', () => {
    const offending = files.filter((file) => file.endsWith('/Token.ts'));

    expect(offending).toEqual([]);
  });

  it('uses public Nest imports instead of internal decorator paths', () => {
    const offending = files.filter((file) => {
      if (!file.endsWith('.ts')) return false;
      const content = readFileSync(file, 'utf8');
      return (
        content.includes('@nestjs/common/decorators/core/inject.decorator') ||
        content.includes('@nestjs/typeorm/dist/common/typeorm.decorators')
      );
    });

    expect(offending).toEqual([]);
  });

  it('uses canonical course resource entity filename in imports', () => {
    const offending = files.filter((file) => {
      if (!file.endsWith('.ts')) return false;
      if (file.endsWith('/CoursesRessources.entity.ts')) return false;
      const content = readFileSync(file, 'utf8');
      return content.includes('CoursesRessources.entity');
    });

    expect(offending).toEqual([]);
  });
});
