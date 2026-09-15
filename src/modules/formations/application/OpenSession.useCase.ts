import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { Bareme } from '../domain/Bareme';
import { SessionCodeAlreadyActiveError } from '../domain/errors/FormationErrors';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { SessionCode } from '../domain/SessionCode';
import { SESSIONS_REPOSITORY } from '../domain/token';
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
  ) {}

  async execute(command: OpenSessionCommand): Promise<OpenSessionResult> {
    this.assertBaremeComplet(command.bareme);
    const session = await this.createSurUnCodeLibre(command);
    return { sessionId: session.id, code: session.code };
  }

  private assertBaremeComplet(bareme: Bareme): void {
    if (bareme.tirages.length === 0) {
      throw new DomainValidationError('Le bareme ne contient aucun tirage');
    }
    const identifiants = bareme.questions.map((question) => question.id);
    const incomplet = bareme.tirages.find((tirage) =>
      identifiants.some((id) => !(id in tirage.solutions)),
    );
    if (incomplet) {
      throw new DomainValidationError(
        `Le tirage ${incomplet.seed} ne couvre pas toutes les questions`,
      );
    }
  }

  private async createSurUnCodeLibre(
    command: OpenSessionCommand,
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
          teacherId: command.teacherId,
          code: candidat,
          bareme: command.bareme,
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
