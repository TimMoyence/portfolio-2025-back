import { Inject, Injectable } from '@nestjs/common';
import { ecranDeRappel } from '../domain/cours/ChoixDesRappels';
import { RappelsIndisponiblesError } from '../domain/errors/FormationErrors';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { MASTERY_REPOSITORY, PARTICIPANTS_REPOSITORY } from '../domain/token';
import { LectureDeSeance } from './LectureDeSeance';

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
    private readonly lecture: LectureDeSeance,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<{ concepts: readonly SyntheseDeConcept[] }> {
    const { session, cours } = await this.lecture.coursLisiblePar(
      sessionId,
      acteur,
    );
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
