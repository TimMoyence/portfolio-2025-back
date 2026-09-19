import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { Bareme } from '../domain/contrats/bareme';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { ouvrirTirages } from '../domain/cours/OuvertureTirages';
import {
  CoursInconnuError,
  SessionCodeAlreadyActiveError,
} from '../domain/errors/FormationErrors';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { SessionCode } from '../domain/SessionCode';
import { CATALOGUE_COURS, SESSIONS_REPOSITORY } from '../domain/token';
import type {
  OpenSessionCommand,
  OpenSessionResult,
} from './dto/OpenSession.command';

const MAX_TENTATIVES_CODE = 20;

@Injectable()
export class OpenSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(command: OpenSessionCommand): Promise<OpenSessionResult> {
    const courant = await this.catalogue.trouverCourant(command.courseSlug);
    if (!courant) {
      throw new CoursInconnuError(command.courseSlug);
    }
    const session = await this.createSurUnCodeLibre(
      command,
      ouvrirTirages(courant.cours, undefined, courant.version),
      courant.version,
    );
    return { sessionId: session.id, code: session.code };
  }

  private async createSurUnCodeLibre(
    command: OpenSessionCommand,
    bareme: Bareme,
    courseVersion: number,
  ): Promise<SessionRecord> {
    for (let tentative = 0; tentative < MAX_TENTATIVES_CODE; tentative += 1) {
      const candidat = SessionCode.generate();
      const pris = await this.sessions.isCodeTaken(candidat);
      if (pris) {
        continue;
      }
      try {
        return await this.sessions.create({
          courseSlug: command.courseSlug,
          courseVersion,
          teacherId: command.teacherId,
          code: candidat,
          bareme,
        });
      } catch (error) {
        if (!(error instanceof SessionCodeAlreadyActiveError)) {
          throw error;
        }
      }
    }
    throw new DomainValidationError(
      'Impossible d allouer un code de session libre',
    );
  }
}
