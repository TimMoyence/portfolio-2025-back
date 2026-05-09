import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { ICategoryInferenceStrategy } from '../../domain/ICategoryInferenceStrategy';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
  CATEGORY_INFERENCE_STRATEGY,
} from '../../domain/token';
import type { ImportBudgetEntriesCommand } from '../dto/ImportBudgetEntries.command';

const BOM_REGEX = new RegExp('^' + String.fromCharCode(0xfeff));
const DIACRITICS_REGEX = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g',
);

/**
 * Importe des entrees de budget depuis un contenu CSV (format Revolut ou
 * compatible). Verifie l'appartenance au groupe, parse le CSV, infere la
 * categorie de chaque ligne via une {@link ICategoryInferenceStrategy} injectee,
 * puis persiste l'ensemble en bulk via le repository.
 *
 * Aucune regle d'inference (et donc aucune donnee personnelle de matching) n'est
 * hardcodee dans ce use case : toute la logique categorisation est externalisee
 * derriere le port pour respect RGPD et testabilite.
 */
@Injectable()
export class ImportBudgetEntriesUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(CATEGORY_INFERENCE_STRATEGY)
    private readonly inferenceStrategy: ICategoryInferenceStrategy,
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
      const inferredName = this.inferenceStrategy.infer(
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
    return value.replace(BOM_REGEX, '').trim();
  }

  private normalizeHeaderForMatch(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '');
  }

  private readRowValue(row: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
      const exact = row[key];
      if (exact !== undefined) {
        return exact;
      }
    }

    const normalizedEntries = Object.entries(row).map(
      ([key, value]) => [this.normalizeHeaderForMatch(key), value] as const,
    );

    for (const key of keys) {
      const found = normalizedEntries.find(
        ([normalizedKey]) =>
          normalizedKey === this.normalizeHeaderForMatch(key),
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
