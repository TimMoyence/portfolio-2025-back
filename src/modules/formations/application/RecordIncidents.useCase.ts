import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../domain/IIncidents.repository';
import { INCIDENT_TYPES } from '../domain/IncidentType';
import { INCIDENTS_REPOSITORY } from '../domain/token';

const MAX_INCIDENTS_PAR_ENVOI = 200;

@Injectable()
export class RecordIncidentsUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
  ) {}

  async execute(inputs: readonly IncidentInput[]): Promise<void> {
    if (inputs.length > MAX_INCIDENTS_PAR_ENVOI) {
      throw new DomainValidationError('Trop d incidents dans un seul envoi');
    }
    const valides = inputs.filter((incident) =>
      INCIDENT_TYPES.includes(incident.type as (typeof INCIDENT_TYPES)[number]),
    );
    if (valides.length === 0) {
      return;
    }
    await this.incidents.createMany(valides);
  }
}
