import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { Cours } from '../domain/contrats/cours';
import type { PilotageEcran } from '../domain/contrats/pilotage';
import { sourcesAReveler } from '../domain/cours/Corrections';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import type { PilotageDemande } from '../domain/cours/PilotageEcrans';
import {
  assertPilotageCompatible,
  fusionnerPilotage,
} from '../domain/cours/PilotageEcrans';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
  UpdateSessionInput,
} from '../domain/ISessions.repository';
import {
  CoursInconnuError,
  InvalidStateTransitionError,
  RevisionDeSeanceObsoleteError,
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

const TENTATIVES_SUR_REVISION_OBSOLETE = 5;

export interface ControlSessionChanges {
  ecran?: number;
  mode?: PacingMode;
  intervalle?: FreeRange | null;
  pilotage?: PilotageDemande;
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

  async apply(
    sessionId: string,
    teacherId: string,
    changements: ControlSessionChanges,
  ): Promise<void> {
    for (
      let tentative = 0;
      tentative < TENTATIVES_SUR_REVISION_OBSOLETE;
      tentative += 1
    ) {
      const misAJour = this.validerEtProjeter(changements);
      const session = await this.assertPilotable(sessionId, teacherId);
      await this.assertDansLesBornesDuCours(session, misAJour, changements);
      try {
        const sessionMiseAJour = await this.sessions.update(
          sessionId,
          misAJour,
          session.revision,
        );
        this.publier(sessionId, sessionMiseAJour);
        return;
      } catch (error) {
        if (!(error instanceof RevisionDeSeanceObsoleteError)) {
          throw error;
        }
      }
    }
    throw new RevisionDeSeanceObsoleteError(sessionId);
  }

  private async assertDansLesBornesDuCours(
    session: SessionRecord,
    misAJour: UpdateSessionInput,
    changements: ControlSessionChanges,
  ): Promise<void> {
    if (
      misAJour.ecranCourant === undefined &&
      misAJour.modeRythme === undefined &&
      !misAJour.intervalleLibre &&
      changements.pilotage === undefined
    ) {
      return;
    }
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
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
    const pilotage =
      changements.pilotage === undefined
        ? session.pilotageEcrans
        : this.pilotageFusionne(cours, session, changements.pilotage);
    const revele = this.corrigesProjetes(cours, session, misAJour, pilotage);
    if (changements.pilotage !== undefined || revele !== pilotage) {
      misAJour.pilotageEcrans = revele;
    }
  }

  private corrigesProjetes(
    cours: Cours,
    session: SessionRecord,
    misAJour: UpdateSessionInput,
    pilotage: Readonly<Record<string, PilotageEcran>>,
  ): Readonly<Record<string, PilotageEcran>> {
    if ((misAJour.modeRythme ?? session.modeRythme) !== 'pilote') {
      return pilotage;
    }
    const aReveler = sourcesAReveler(
      cours,
      misAJour.ecranCourant ?? session.ecranCourant,
    ).filter((source) => pilotage[source]?.revele !== true);
    return aReveler.reduce(
      (courant, screenId) =>
        fusionnerPilotage(courant, { screenId, revele: true }),
      pilotage,
    );
  }

  private pilotageFusionne(
    cours: Cours,
    session: SessionRecord,
    demande: PilotageDemande,
  ): Readonly<Record<string, PilotageEcran>> {
    const ecran = cours.ecrans.find(
      (candidat) => candidat.id === demande.screenId,
    );
    if (ecran === undefined) {
      throw new DomainValidationError(
        `Écran ${demande.screenId} absent du cours de cette séance`,
      );
    }
    assertPilotageCompatible(ecran, demande);
    return fusionnerPilotage(session.pilotageEcrans, demande);
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
      revision: session.revision,
      pilotage: session.pilotageEcrans,
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
