import { Inject, Injectable } from '@nestjs/common';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../domain/IIncidents.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertSeanceNonTerminee } from '../domain/SessionState';
import { INCIDENTS_REPOSITORY, SESSIONS_REPOSITORY } from '../domain/token';
import { seanceExistante } from './CoursDeLaSeance';

@Injectable()
export class RecordIncidentsUseCase {
  constructor(
    @Inject(INCIDENTS_REPOSITORY)
    private readonly incidents: IIncidentsRepository,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
  ) {}

  async execute(
    sessionId: string,
    inputs: readonly IncidentInput[],
  ): Promise<void> {
    const session = await seanceExistante(this.sessions, sessionId);
    assertSeanceNonTerminee(session.etat);
    if (inputs.length === 0) {
      return;
    }
    await this.incidents.createMany(inputs);
  }
}
