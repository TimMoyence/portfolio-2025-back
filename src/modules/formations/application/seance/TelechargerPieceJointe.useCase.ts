import { Inject, Injectable } from '@nestjs/common';
import type { Cours } from '../../domain/contrats/cours';
import { estReservee } from '../../domain/cours/structure/Cours';
import {
  ecranParId,
  pieceJointeServieAuPoste,
} from '../../domain/cours/diffusion/EcranServi';
import { PieceJointeIntrouvableError } from '../../domain/errors/FormationErrors';
import type {
  ClasseurTelecharge,
  IClasseursDeCours,
} from '../../domain/bilan/IClasseursDeCours.port';
import type { ActeurFormation } from '../../domain/seance/acces/SessionOwnership';
import { CLASSEURS_DE_COURS } from '../../domain/token';
import { LectureDeSeance } from './lecture/LectureDeSeance';
import type { CibleDuParticipant } from '../participants/ParticipationEnSeance';
import { ParticipationEnSeance } from '../participants/ParticipationEnSeance';

@Injectable()
export class TelechargerPieceJointeUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
    private readonly lecture: LectureDeSeance,
    @Inject(CLASSEURS_DE_COURS)
    private readonly classeurs: IClasseursDeCours,
  ) {}

  async pourLeParticipant(
    cible: CibleDuParticipant,
    ecranId: string,
  ): Promise<ClasseurTelecharge> {
    const { session, cours } = await this.participation.contexte(cible);
    const { classeur } = pieceJointeServieAuPoste(session, cours, ecranId);
    return this.classeurs.lire(classeur);
  }

  async pourLeFormateur(
    sessionId: string,
    acteur: ActeurFormation,
    ecranId: string,
  ): Promise<ClasseurTelecharge> {
    const { cours } = await this.lecture.coursLisiblePar(sessionId, acteur);
    return this.classeurs.lire(classeurReserveDe(cours, ecranId));
  }
}

function classeurReserveDe(cours: Cours, ecranId: string): string {
  const pieceJointe = ecranParId(cours, ecranId)?.pieceJointe;
  if (pieceJointe === undefined || !estReservee(pieceJointe)) {
    throw new PieceJointeIntrouvableError(ecranId);
  }
  return pieceJointe.classeur;
}
