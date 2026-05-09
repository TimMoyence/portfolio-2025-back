import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
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
  {
    keywords: ['free telecom', 'mobile tim & maria'],
    categoryName: 'Forfait telephone Tim & Maria',
  },
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
      'boucherie',
      'origines',
    ],
    categoryName: 'Courses',
  },
  { keywords: ['pharmacie'], categoryName: 'Achat pour la beauté' },
  {
    keywords: [
      'pub',
      'kitchen',
      'restaurant',
      'darwi',
      'cassonade',
      'arlu',
      'magasin general',
      'les brocs',
      'del arte',
    ],
    categoryName: 'Restaurant',
  },
  { keywords: ['fleurs', 'garcia aurore'], categoryName: 'Gifts' },
  { keywords: ["art'tick"], categoryName: 'Entertainment' },
  {
    keywords: ['salle de sport', 'fitness', 'gym', 'basic fit'],
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
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    const categories = await this.categoryRepo.findByGroupId(command.groupId);
    const catNameToId = new Map(categories.map((c) => [c.name, c.id]));

    const rows = this.parseCsv(command.csvContent);
    const entries = rows.map((row) => {
      const description = this.readRowValue(row, ['Description']).trim();
      const amount = this.parseCsvAmount(
        this.readRowValue(row, ['Amount', 'Montant']),
      );
      const inferredName = this.inferCategoryName(
        description,
        this.readRowValue(row, ['Type']),
        amount,
      );
      const categoryId = inferredName
        ? (catNameToId.get(inferredName) ?? null)
        : null;

      return BudgetEntry.create({
        groupId: command.groupId,
        createdByUserId: command.userId,
        categoryId,
        date:
          this.readRowValue(row, ['Started Date', 'Completed Date', 'Date']) ??
          '',
        description,
        amount,
        type: 'VARIABLE',
        state: this.readRowValue(row, ['State']) || 'COMPLETED',
      });
    });

    return this.entryRepo.createMany(entries);
  }

  private inferCategoryName(
    description: string,
    type: string,
    amount: number,
  ): string | null {
    const normalized = this.normalizeText(description);
    const normalizedType = this.normalizeText(type);

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

    const exactCategoryMatch = CATEGORY_RULES.find(
      (rule) => this.normalizeText(rule.categoryName) === normalized,
    );
    if (exactCategoryMatch) {
      return exactCategoryMatch.categoryName;
    }

    if (normalizedType.includes('transfer') && normalized.includes('pocket')) {
      return 'Pockets';
    }

    return 'Autres';
  }

  private parseCsv(csvText: string): Record<string, string>[] {
    const delimiter = this.detectDelimiter(csvText);
    const rows: string[][] = [];
    let current = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const character = csvText[index];
      const next = csvText[index + 1];

      if (character === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (character === delimiter && !inQuotes) {
        row.push(current);
        current = '';
        continue;
      }

      if ((character === '\n' || character === '\r') && !inQuotes) {
        if (character === '\r' && next === '\n') {
          index += 1;
        }
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
        continue;
      }

      current += character;
    }

    if (current || row.length) {
      row.push(current);
      rows.push(row);
    }

    const [rawHeaders = [], ...dataRows] = rows.filter((entry) =>
      entry.some((cell) => cell !== ''),
    );
    const headers = rawHeaders.map((header) => this.normalizeHeader(header));

    return dataRows.map((values) => {
      const mappedRow: Record<string, string> = {};
      headers.forEach((header, index) => {
        mappedRow[header] = values[index] ?? '';
      });
      return mappedRow;
    });
  }

  private detectDelimiter(csvText: string): string {
    const firstLine = csvText.split(/\r?\n/, 1)[0] ?? '';
    const commaCount = (firstLine.match(/,/g) ?? []).length;
    const semicolonCount = (firstLine.match(/;/g) ?? []).length;
    const tabCount = (firstLine.match(/\t/g) ?? []).length;

    if (semicolonCount > commaCount && semicolonCount >= tabCount) {
      return ';';
    }

    if (tabCount > commaCount && tabCount > semicolonCount) {
      return '\t';
    }

    return ',';
  }

  private normalizeHeader(value: string): string {
    return value.replace(/^\uFEFF/, '').trim();
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private readRowValue(row: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
      const exact = row[key];
      if (exact !== undefined) {
        return exact;
      }
    }

    const normalizedEntries = Object.entries(row).map(
      ([key, value]) => [this.normalizeText(key), value] as const,
    );

    for (const key of keys) {
      const found = normalizedEntries.find(
        ([normalizedKey]) => normalizedKey === this.normalizeText(key),
      );
      if (found) {
        return found[1];
      }
    }

    return '';
  }

  private parseCsvAmount(value: string): number {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const normalized = trimmed
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(?:[,.]|$))/g, '')
      .replace(',', '.');

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
