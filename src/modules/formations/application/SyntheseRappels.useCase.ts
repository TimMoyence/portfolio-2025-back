import { Inject, Injectable } from '@nestjs/common';
import { ecranDeRappel } from '../domain/cours/ChoixDesRappels';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { RappelsIndisponiblesError } from '../domain/errors/FormationErrors';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import {
  CATALOGUE_COURS,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { coursDeLaSeance } from './CoursDeLaSeance';
import { seanceLisiblePar } from './SessionAccess';

export interface SyntheseDeConcept {
  concept: string;
  libelle: string;
  boite1: number;
  boite2: number;
  boite3: number;
  nonVus: number;
}

@Injectable()
export class SyntheseRappelsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<{ concepts: readonly SyntheseDeConcept[] }> {
    const session = await seanceLisiblePar(this.sessions, sessionId, acteur);
    const cours = await coursDeLaSeance(this.catalogue, session);
    const cible = ecranDeRappel(cours);
    if (cible === null) {
      throw new RappelsIndisponiblesError(session.courseSlug);
    }
    const concepts = [
      ...new Set(cible.banque.map((question) => question.concept)),
    ];
    const inscrits = await this.participants.listBySession(sessionId);
    const maitrises = await Promise.all(
      inscrits.map((participant) =>
        this.mastery.findByStudentKey(participant.studentKey),
      ),
    );

    return {
      concepts: concepts.map((concept) => {
        const boites = maitrises.map(
          (entrees) =>
            entrees.find((entree) => entree.concept === concept)?.boite ?? null,
        );
        return {
          concept,
          libelle: concept,
          boite1: boites.filter((boite) => boite === 1).length,
          boite2: boites.filter((boite) => boite === 2).length,
          boite3: boites.filter((boite) => boite === 3).length,
          nonVus: boites.filter((boite) => boite === null).length,
        };
      }),
    };
  }
}
