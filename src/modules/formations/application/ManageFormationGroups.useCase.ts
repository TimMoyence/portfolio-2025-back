import { Inject, Injectable } from '@nestjs/common';
import type {
  FormationGroupRecord,
  IFormationGroupsRepository,
} from '../domain/IFormationGroups.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  FORMATION_GROUPS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { seanceLisiblePar, seancePilotablePar } from './SessionAccess';

const CHAMP_NOM_DU_GROUPE = 'Le nom du groupe';

@Injectable()
export class ManageFormationGroupsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(FORMATION_GROUPS_REPOSITORY)
    private readonly groups: IFormationGroupsRepository,
  ) {}

  async list(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<readonly FormationGroupRecord[]> {
    await seanceLisiblePar(this.sessions, sessionId, acteur);
    return this.groups.listBySession(sessionId);
  }

  async create(
    sessionId: string,
    teacherId: string,
    name: string,
  ): Promise<FormationGroupRecord> {
    const nom = texteRenseigne(name, CHAMP_NOM_DU_GROUPE);
    await seancePilotablePar(this.sessions, sessionId, teacherId);
    return this.groups.create(sessionId, nom);
  }

  async rename(
    sessionId: string,
    teacherId: string,
    groupId: string,
    name: string,
  ): Promise<FormationGroupRecord> {
    const nom = texteRenseigne(name, CHAMP_NOM_DU_GROUPE);
    await seancePilotablePar(this.sessions, sessionId, teacherId);
    return this.groups.rename(sessionId, groupId, nom);
  }

  async assign(
    sessionId: string,
    teacherId: string,
    participantId: string,
    groupId: string | null,
  ): Promise<void> {
    await seancePilotablePar(this.sessions, sessionId, teacherId);
    await this.groups.assignParticipant(sessionId, participantId, groupId);
  }
}
