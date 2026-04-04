import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IRecurringEntryRepository } from '../../domain/IRecurringEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { RecurringEntry } from '../../domain/RecurringEntry';
import {
  BUDGET_ENTRY_REPOSITORY,
  RECURRING_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { ApplyRecurringEntriesCommand } from '../dto/ApplyRecurringEntries.command';

/**
 * Genere les BudgetEntry a partir des entrees recurrentes actives pour un mois donne.
 *
 * Pour chaque recurring entry active :
 * - MONTHLY : 1 entree au dayOfMonth du mois/annee
 * - WEEKLY : 4-5 entrees (une par semaine du mois)
 * - BIWEEKLY : 2 entrees (une toutes les deux semaines)
 */
@Injectable()
export class ApplyRecurringEntriesUseCase {
  constructor(
    @Inject(RECURRING_ENTRY_REPOSITORY)
    private readonly recurringRepo: IRecurringEntryRepository,
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: ApplyRecurringEntriesCommand): Promise<BudgetEntry[]> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    // Garde d'idempotence : si des entries PENDING existent deja pour ce mois, ne pas recreer
    const existingEntries = await this.entryRepo.findByFilters({
      groupId: command.groupId,
      month: command.month,
      year: command.year,
    });
    const pendingEntries = existingEntries.filter((e) => e.state === 'PENDING');
    if (pendingEntries.length > 0) {
      return pendingEntries;
    }

    const recurring = await this.recurringRepo.findActiveByGroupId(
      command.groupId,
    );

    const entriesToCreate: BudgetEntry[] = [];

    for (const rec of recurring) {
      const dates = this.generateDates(rec, command.month, command.year);
      for (const date of dates) {
        const entry = BudgetEntry.create({
          groupId: rec.groupId,
          createdByUserId: rec.createdByUserId,
          categoryId: rec.categoryId,
          date: date.toISOString().slice(0, 10),
          description: rec.description,
          amount: rec.amount,
          type: rec.type,
          state: 'PENDING',
        });
        entriesToCreate.push(entry);
      }
    }

    if (entriesToCreate.length === 0) {
      return [];
    }

    return this.entryRepo.createMany(entriesToCreate);
  }

  /**
   * Genere les dates applicables pour une recurring entry dans le mois donne.
   * Filtre selon startDate/endDate de la recurring entry.
   */
  private generateDates(
    rec: RecurringEntry,
    month: number,
    year: number,
  ): Date[] {
    const dates: Date[] = [];

    if (rec.frequency === 'MONTHLY') {
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const day = Math.min(rec.dayOfMonth!, daysInMonth);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (this.isDateInRange(date, rec)) {
        dates.push(date);
      }
    } else if (rec.frequency === 'WEEKLY') {
      const allWeekDates = this.getDatesForDayOfWeekInMonth(
        rec.dayOfWeek!,
        month,
        year,
      );
      for (const date of allWeekDates) {
        if (this.isDateInRange(date, rec)) {
          dates.push(date);
        }
      }
    } else if (rec.frequency === 'BIWEEKLY') {
      const allWeekDates = this.getDatesForDayOfWeekInMonth(
        rec.dayOfWeek!,
        month,
        year,
      );
      // Prendre la 1ere et la 3eme occurrence (toutes les 2 semaines)
      for (let i = 0; i < allWeekDates.length; i += 2) {
        if (this.isDateInRange(allWeekDates[i], rec)) {
          dates.push(allWeekDates[i]);
        }
      }
    }

    return dates;
  }

  /** Verifie que la date est dans la plage startDate/endDate de la recurring entry. */
  private isDateInRange(date: Date, rec: RecurringEntry): boolean {
    const startDate =
      rec.startDate instanceof Date
        ? rec.startDate
        : new Date(rec.startDate as unknown as string);
    if (date < startDate) return false;

    if (rec.endDate) {
      const endDate =
        rec.endDate instanceof Date
          ? rec.endDate
          : new Date(rec.endDate as unknown as string);
      if (date > endDate) return false;
    }

    return true;
  }

  /** Retourne toutes les dates d'un jour de semaine donne dans un mois. */
  private getDatesForDayOfWeekInMonth(
    dayOfWeek: number,
    month: number,
    year: number,
  ): Date[] {
    const dates: Date[] = [];
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCDay() === dayOfWeek) {
        dates.push(date);
      }
    }

    return dates;
  }
}
