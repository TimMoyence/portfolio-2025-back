import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { DeleteEntryCommand } from '../dto/DeleteEntry.command';

@Injectable()
export class DeleteEntryUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
  ) {}

  async execute(command: DeleteEntryCommand): Promise<void> {
    const entry = await this.entryRepo.findById(command.entryId);
    if (!entry) {
      throw new ResourceNotFoundError('Entree de consommation introuvable');
    }

    if (entry.userId !== command.userId) {
      throw new InsufficientPermissionsError(
        "L'utilisateur n'est pas proprietaire de cette entree",
      );
    }

    await this.entryRepo.delete(command.entryId);
  }
}
