import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../domain/IIncidents.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import {
  envoiDansLaLimite,
  filtrerIncidentsConnus,
} from '../domain/IncidentType';
import { INCIDENTS_REPOSITORY, PARTICIPANTS_REPOSITORY } from '../domain/token';
import { participantActif } from './ParticipantActif';

@Injectable()
export class RecordIncidentsUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
  ) {}

  async execute(
    sessionId: string,
    participantId: string,
    inputs: readonly IncidentInput[],
  ): Promise<void> {
    if (!envoiDansLaLimite(inputs.length)) {
      throw new DomainValidationError('Trop d incidents dans un seul envoi');
    }
    await participantActif(this.participants, sessionId, participantId);
    const valides = filtrerIncidentsConnus(inputs);
    if (valides.length === 0) {
      return;
    }
    await this.incidents.createMany(valides);
  }
}
