import { Inject, Injectable } from '@nestjs/common';
import { solutionsIdentiques } from '../domain/Bareme';
import type { Cours } from '../domain/contrats/cours';
import type { CoursPublic } from '../domain/contrats/tirage';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { TirageAmbiguError, tirer } from '../domain/cours/Tirage';
import type { TirageDuCours } from '../domain/cours/Tirage';
import {
  CoursInconnuError,
  CoursModifieError,
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import {
  CATALOGUE_COURS,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface LireSujetQuery {
  sessionId: string;
  participantId: string;
}

@Injectable()
export class LireSujetUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(query: LireSujetQuery): Promise<CoursPublic> {
    const session = await this.sessions.findById(query.sessionId);
    if (!session) {
      throw new SessionNotFoundError(query.sessionId);
    }
    const participant = await this.participants.findById(query.participantId);
    if (!participant || participant.sessionId !== query.sessionId) {
      throw new ParticipantNotFoundError(query.participantId);
    }
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    const tirage = this.tirerOuLever(cours, participant.seed);
    const stockees = session.bareme.tirages.find(
      (entree) => entree.seed === participant.seed,
    )?.solutions;
    if (
      Object.keys(tirage.solutions).length !== 0 &&
      !solutionsIdentiques(tirage.solutions, stockees)
    ) {
      throw new CoursModifieError();
    }
    const dernier = this.dernierEcranServi(session, tirage.sujet.ecrans.length);
    return {
      ...tirage.sujet,
      ecrans: tirage.sujet.ecrans.map((ecran, index) =>
        index <= dernier
          ? ecran
          : {
              ...ecran,
              type: 'ecran-verrouille',
              interactif: false,
              donnees: {},
            },
      ),
    };
  }

  private dernierEcranServi(
    session: {
      etat: string;
      modeRythme: string;
      ecranCourant: number;
      intervalleLibre: { dernier: number } | null;
    },
    total: number,
  ): number {
    if (session.etat === 'terminee') {
      return total - 1;
    }
    if (session.modeRythme === 'libre' && session.intervalleLibre === null) {
      return total - 1;
    }
    if (session.modeRythme === 'libre' && session.intervalleLibre !== null) {
      return session.intervalleLibre.dernier;
    }
    return session.ecranCourant;
  }

  private tirerOuLever(cours: Cours, seed: number): TirageDuCours {
    try {
      return tirer(cours, seed);
    } catch (erreur) {
      if (erreur instanceof TirageAmbiguError) {
        throw new CoursModifieError();
      }
      throw erreur;
    }
  }
}
