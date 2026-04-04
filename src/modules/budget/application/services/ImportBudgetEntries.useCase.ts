import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { ImportBudgetEntriesCommand } from '../dto/ImportBudgetEntries.command';

/** Regles d'inference de categorie basees sur la description. */
const CATEGORY_RULES: Array<{ keywords: string[]; categoryName: string }> = [
  { keywords: ['loick babin', 'les voutes'], categoryName: 'Loyer' },
  { keywords: ['edf'], categoryName: 'Electricité & Internet' },
  { keywords: ['free telecom'], categoryName: 'Forfait telephone Tim & Maria' },
  {
    keywords: ['internet', 'bbox', 'orange', 'sfr', 'bouygues'],
    categoryName: 'Electricité & Internet',
  },
  { keywords: ['maif'], categoryName: 'Assur. Habitation' },
  {
    keywords: ['citiz', 'uber', 'kmlocal'],
    categoryName: 'Voiture utilisation',
  },
  {
    keywords: ['amazon', 'netflix', 'ororo'],
    categoryName: 'Netflix & Amazon & Ororo',
  },
  {
    keywords: [
      'carrefour',
      'e.leclerc',
      'picard',
      'lidl',
      'bio coop',
      'casado primeurs',
      'le destin fromager',
      'bigazzi',
      'babel bread',
      'ly kim hak',
      'qu4tre qu4rts',
      'anom cafe club',
    ],
    categoryName: 'Courses',
  },
  { keywords: ['pharmacie'], categoryName: 'Achat pour la beauté' },
  {
    keywords: ['pub', 'kitchen', 'restaurant', 'darwi', 'cassonade', 'arlu'],
    categoryName: 'Restaurant',
  },
  { keywords: ['fleurs', 'garcia aurore'], categoryName: 'Gifts' },
  {
    keywords: ['salle de sport', 'fitness', 'gym'],
    categoryName: 'Salle de sport',
  },
];

/** Importe des entrees de budget depuis un contenu CSV. */
@Injectable()
export class ImportBudgetEntriesUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
  ) {}

  async execute(command: ImportBudgetEntriesCommand): Promise<BudgetEntry[]> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this budget group');
    }

    const categories = await this.categoryRepo.findByGroupId(command.groupId);
    const catNameToId = new Map(categories.map((c) => [c.name, c.id]));

    const rows = this.parseCsv(command.csvContent);
    const entries = rows.map((row) => {
      const description = (row['Description'] ?? '').trim();
      const amount = parseFloat(row['Amount'] ?? '0');
      const inferredName = this.inferCategoryName(description, amount);
      const categoryId = inferredName
        ? (catNameToId.get(inferredName) ?? null)
        : null;

      return BudgetEntry.create({
        groupId: command.groupId,
        createdByUserId: command.userId,
        categoryId,
        date: row['Started Date'] ?? row['Completed Date'] ?? row['Date'] ?? '',
        description,
        amount,
        type: 'VARIABLE',
        state: row['State'] ?? 'COMPLETED',
      });
    });

    return this.entryRepo.createMany(entries);
  }

  private inferCategoryName(
    description: string,
    amount: number,
  ): string | null {
    const normalized = description
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (amount > 0) {
      if (
        normalized.includes('tim moyence') ||
        normalized.includes('maria naumenko')
      ) {
        return 'Contribution';
      }
      if (normalized.includes('pocket withdrawal')) {
        return 'Pockets';
      }
    }

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => normalized.includes(kw))) {
        return rule.categoryName;
      }
    }

    if (normalized.includes('transfer') && normalized.includes('pocket')) {
      return 'Pockets';
    }

    return 'Autres';
  }

  private parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = this.parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] ?? ''));
      return row;
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
