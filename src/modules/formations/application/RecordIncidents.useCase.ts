import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../domain/IIncidents.repository';
import {
  envoiDansLaLimite,
  filtrerIncidentsConnus,
} from '../domain/IncidentType';
import { INCIDENTS_REPOSITORY } from '../domain/token';

@Injectable()
export class RecordIncidentsUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
  ) {}

  async execute(inputs: readonly IncidentInput[]): Promise<void> {
    if (!envoiDansLaLimite(inputs.length)) {
      throw new DomainValidationError('Trop d incidents dans un seul envoi');
    }
    const valides = filtrerIncidentsConnus(inputs);
    if (valides.length === 0) {
      return;
    }
    await this.incidents.createMany(valides);
  }
}
