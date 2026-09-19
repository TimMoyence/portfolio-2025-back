import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
  UpdateSessionInput,
} from '../domain/ISessions.repository';
import {
  CoursInconnuError,
  InvalidStateTransitionError,
  SessionClosedError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../domain/errors/FormationErrors';
import { isFreeRangeValid } from '../domain/PacingMode';
import type { FreeRange, PacingMode } from '../domain/PacingMode';
import { canTransition } from '../domain/SessionState';
import {
  CATALOGUE_COURS,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface ControlSessionChanges {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange | null;
}

@Injectable()
export class ControlSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  /**
   * Le pilotage valide en deux temps : la syntaxe des changements (numero
   * d'ecran, mode connu) est verifiee avant la moindre lecture ; les bornes
   * qui dependent du cours de la session (ecran dans le cours, intervalle de
   * rythme libre) ne peuvent l'etre qu'apres la lecture de la session dans
   * assertPilotable, mais restent verifiees avant l'unique ecriture et
   * l'unique publication.
   *
   * Un ecran applique avant qu'un rythme invalide ne soit refuse laisserait
   * les trente postes de la classe sur une diapositive que le formateur ne
   * croit pas avoir envoyee, avec un 400 pour seule trace — la validation
   * doit donc preceder l'effet, pas l'accompagner
   * (FormationsPresenter.controller.ts).
   */
  async apply(
    sessionId: string,
    teacherId: string,
    changements: ControlSessionChanges,
  ): Promise<void> {
    const misAJour = this.validerEtProjeter(changements);
    const session = await this.assertPilotable(sessionId, teacherId);
    await this.assertDansLesBornesDuCours(
      session.courseSlug,
      session.courseVersion,
      misAJour,
    );
    const sessionMiseAJour = await this.sessions.update(sessionId, misAJour);
    this.publier(sessionId, sessionMiseAJour);
  }

  private async assertDansLesBornesDuCours(
    courseSlug: string,
    courseVersion: number,
    misAJour: UpdateSessionInput,
  ): Promise<void> {
    if (misAJour.ecranCourant === undefined && !misAJour.intervalleLibre) {
      return;
    }
    const cours = await this.catalogue.trouver(courseSlug, courseVersion);
    if (!cours) {
      throw new CoursInconnuError(courseSlug);
    }
    const totalEcrans = cours.ecrans.length;
    if (
      misAJour.ecranCourant !== undefined &&
      misAJour.ecranCourant >= totalEcrans
    ) {
      throw new DomainValidationError(
        `Écran ${misAJour.ecranCourant} hors du cours : ${totalEcrans} écrans`,
      );
    }
    if (
      misAJour.intervalleLibre &&
      !isFreeRangeValid(misAJour.intervalleLibre, totalEcrans)
    ) {
      throw new DomainValidationError(
        `Intervalle de rythme libre hors du cours : ${totalEcrans} écrans`,
      );
    }
  }

  private validerEtProjeter(
    changements: ControlSessionChanges,
  ): UpdateSessionInput {
    const misAJour: UpdateSessionInput = {};
    if (changements.ecran !== undefined) {
      if (!Number.isInteger(changements.ecran) || changements.ecran < 0) {
        throw new DomainValidationError(
          `Numero d ecran invalide: ${changements.ecran}`,
        );
      }
      misAJour.ecranCourant = changements.ecran;
    }
    if (changements.mode !== undefined) {
      misAJour.modeRythme = changements.mode;
      misAJour.intervalleLibre =
        changements.mode === 'libre'
          ? this.intervalleValide(changements.intervalle ?? null)
          : null;
    }
    return misAJour;
  }

  private intervalleValide(intervalle: FreeRange | null): FreeRange {
    if (intervalle === null || !isFreeRangeValid(intervalle)) {
      throw new DomainValidationError(
        'Intervalle de rythme libre invalide : premier et dernier écrans entiers, positifs, le premier avant le dernier',
      );
    }
    return intervalle;
  }

  async start(sessionId: string, teacherId: string): Promise<void> {
    const session = await this.assertPilotable(sessionId, teacherId);
    if (!canTransition(session.etat, 'en_cours')) {
      throw new InvalidStateTransitionError(session.etat, 'en_cours');
    }
    const misAJour = await this.sessions.update(sessionId, {
      etat: 'en_cours',
    });
    this.publier(sessionId, misAJour);
  }

  private publier(sessionId: string, session: SessionRecord): void {
    const enCache = this.cache.read(sessionId);
    this.cache.publish(sessionId, {
      etat: session.etat,
      modeRythme: session.modeRythme,
      ecranCourant: session.ecranCourant,
      intervalleLibre: session.intervalleLibre,
      participants: enCache?.participants ?? 0,
      majLe: session.majLe,
    });
  }

  private async assertPilotable(
    sessionId: string,
    teacherId: string,
  ): Promise<SessionRecord> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    if (session.teacherId !== teacherId) {
      throw new SessionNotOwnedError(sessionId);
    }
    if (session.etat === 'terminee') {
      throw new SessionClosedError();
    }
    return session;
  }
}
