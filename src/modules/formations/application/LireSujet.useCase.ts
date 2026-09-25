import { Injectable } from '@nestjs/common';
import { solutionsDuTirage, solutionsIdentiques } from '../domain/Bareme';
import {
  correctionDeLEcranRevele,
  correctionServie,
  ecranVerrouille,
  exempleAuRythmeDuPilotage,
} from '../domain/cours/Diffusion';
import { dernierEcranServi } from '../domain/cours/EcranServi';
import type { Cours } from '../domain/contrats/cours';
import type { CoursPublic, EcranPublic } from '../domain/contrats/tirage';
import { TirageAmbiguError, tirer } from '../domain/cours/Tirage';
import type { TirageDuCours } from '../domain/cours/Tirage';
import { CoursModifieError } from '../domain/errors/FormationErrors';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface LireSujetQuery {
  sessionId: string;
  participantId: string;
}

@Injectable()
export class LireSujetUseCase {
  constructor(private readonly participation: ParticipationEnSeance) {}

  async execute(query: LireSujetQuery): Promise<CoursPublic> {
    const { session, participant, cours } =
      await this.participation.contexte(query);
    const tirage = this.tirerOuLever(cours, participant.seed);
    const stockees = solutionsDuTirage(session.bareme, participant.seed);
    if (
      Object.keys(tirage.solutions).length !== 0 &&
      !solutionsIdentiques(tirage.solutions, stockees)
    ) {
      throw new CoursModifieError();
    }
    const terminee = session.etat === 'terminee';
    const dernier = dernierEcranServi(session, tirage.sujet.ecrans.length);
    const sourceRevelee = (source: string): boolean =>
      terminee || session.pilotageEcrans[source]?.revele === true;
    return {
      ...tirage.sujet,
      ecrans: tirage.sujet.ecrans.map((ecran, index) => {
        if (terminee) {
          return this.avecCorrection(cours, index, ecran, tirage, true);
        }
        if (
          index > dernier ||
          (ecran.ecranCorrige !== undefined &&
            !sourceRevelee(ecran.ecranCorrige))
        ) {
          return ecranVerrouille(ecran);
        }
        return this.avecCorrection(
          cours,
          index,
          exempleAuRythmeDuPilotage(ecran, session.pilotageEcrans[ecran.id]),
          tirage,
          sourceRevelee(ecran.id),
        );
      }),
    };
  }

  private avecCorrection(
    cours: Cours,
    index: number,
    ecran: EcranPublic,
    tirage: TirageDuCours,
    revele: boolean,
  ): EcranPublic {
    const correction =
      correctionServie(cours, cours.ecrans[index], tirage) ??
      (revele ? correctionDeLEcranRevele(cours.ecrans[index], tirage) : null);
    return correction === null ? ecran : { ...ecran, correction };
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
