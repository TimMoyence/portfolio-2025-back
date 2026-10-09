import { Inject, Injectable } from '@nestjs/common';
import type { Cours } from '../domain/contrats/cours';
import { classeurATelecharger, estReservee } from '../domain/cours/Cours';
import { ECRAN_VERROUILLE } from '../domain/cours/Diffusion';
import {
  EcranNonServiError,
  PieceJointeIntrouvableError,
} from '../domain/errors/FormationErrors';
import type { IClasseursDeCours } from '../domain/IClasseursDeCours.port';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { CLASSEURS_DE_COURS } from '../domain/token';
import { LectureDeSeance } from './LectureDeSeance';
import { LireSujetUseCase } from './LireSujet.useCase';
import type { CibleDuParticipant } from './ParticipationEnSeance';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface ClasseurTelecharge {
  readonly nom: string;
  readonly type: string;
  readonly contenu: Uint8Array;
}

@Injectable()
export class TelechargerPieceJointeUseCase {
  constructor(
    private readonly sujet: LireSujetUseCase,
    private readonly participation: ParticipationEnSeance,
    private readonly lecture: LectureDeSeance,
    @Inject(CLASSEURS_DE_COURS)
    private readonly classeurs: IClasseursDeCours,
  ) {}

  async pourLeParticipant(
    cible: CibleDuParticipant,
    ecranId: string,
  ): Promise<ClasseurTelecharge> {
    const { ecrans } = await this.sujet.execute(cible);
    if (
      ecrans.find((ecran) => ecran.id === ecranId)?.type === ECRAN_VERROUILLE
    ) {
      throw new EcranNonServiError(ecranId);
    }
    const { cours } = await this.participation.contexte(cible);
    return this.telecharger(cours, ecranId);
  }

  async pourLeFormateur(
    sessionId: string,
    acteur: ActeurFormation,
    ecranId: string,
  ): Promise<ClasseurTelecharge> {
    const { cours } = await this.lecture.coursLisiblePar(sessionId, acteur);
    return this.telecharger(cours, ecranId);
  }

  private async telecharger(
    cours: Cours,
    ecranId: string,
  ): Promise<ClasseurTelecharge> {
    const pieceJointe = cours.ecrans.find(
      (ecran) => ecran.id === ecranId,
    )?.pieceJointe;
    if (pieceJointe === undefined || !estReservee(pieceJointe)) {
      throw new PieceJointeIntrouvableError(ecranId);
    }
    return {
      ...classeurATelecharger(pieceJointe.classeur),
      contenu: await this.classeurs.lire(pieceJointe.classeur),
    };
  }
}
