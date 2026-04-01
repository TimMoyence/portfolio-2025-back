import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { ImportBudgetEntriesCommand } from '../dto/ImportBudgetEntries.command';

/** Importe des entrees de budget depuis un contenu CSV. */
@Injectable()
export class ImportBudgetEntriesUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: ImportBudgetEntriesCommand): Promise<BudgetEntry[]> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this budget group');
    }

    const rows = this.parseCsv(command.csvContent);
    const entries = rows.map((row) =>
      BudgetEntry.create({
        groupId: command.groupId,
        createdByUserId: command.userId,
        date: row['Started Date'] ?? row['Completed Date'] ?? row['Date'] ?? '',
        description: (row['Description'] ?? '').trim(),
        amount: parseFloat(row['Amount'] ?? '0'),
        type: 'VARIABLE',
        state: row['State'] ?? 'COMPLETED',
      }),
    );

    return this.entryRepo.createMany(entries);
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
