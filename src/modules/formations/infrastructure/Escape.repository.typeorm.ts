import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IEscapeRepository,
  ProgressionEnigmeRecord,
  TentativeEnigmeInput,
} from '../domain/IEscape.repository';
import { FormationEscapeAttemptEntity } from './entities/FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './entities/FormationEscapeProgress.entity';

interface LigneDeTentative {
  tentatives: number;
}

@Injectable()
export class EscapeRepositoryTypeORM implements IEscapeRepository {
  constructor(
    @InjectRepository(FormationEscapeProgressEntity)
    private readonly progression: Repository<FormationEscapeProgressEntity>,
    @InjectRepository(FormationEscapeAttemptEntity)
    private readonly tentatives: Repository<FormationEscapeAttemptEntity>,
  ) {}

  async listerProgression(
    participantId: string,
    parcoursId: string,
  ): Promise<readonly ProgressionEnigmeRecord[]> {
    const lignes = await this.progression.find({
      where: { participantId, parcoursId },
    });
    return lignes.map((ligne) => this.toDomain(ligne));
  }

  async listerProgressionDeSeance(
    sessionId: string,
  ): Promise<readonly ProgressionEnigmeRecord[]> {
    const lignes = await this.progression.find({ where: { sessionId } });
    return lignes.map((ligne) => this.toDomain(ligne));
  }

  async incrementerTentative(input: {
    readonly sessionId: string;
    readonly participantId: string;
    readonly parcoursId: string;
    readonly enigmeId: string;
    readonly plafond: number;
  }): Promise<number | null> {
    const lignes: LigneDeTentative[] = await this.progression.query(
      `INSERT INTO formation_escape_progress
         (participant_id, enigme_id, session_id, parcours_id, tentatives)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (participant_id, enigme_id) DO UPDATE
         SET tentatives = formation_escape_progress.tentatives + 1
         WHERE formation_escape_progress.tentatives < $5
           AND formation_escape_progress.resolue_le IS NULL
       RETURNING tentatives`,
      [
        input.participantId,
        input.enigmeId,
        input.sessionId,
        input.parcoursId,
        input.plafond,
      ],
    );
    return lignes.length === 0 ? null : Number(lignes[0].tentatives);
  }

  async marquerResolue(participantId: string, enigmeId: string): Promise<void> {
    await this.progression.update(
      { participantId, enigmeId },
      { resolueLe: new Date() },
    );
  }

  async journaliser(input: TentativeEnigmeInput): Promise<void> {
    await this.tentatives.save(this.tentatives.create({ ...input }));
  }

  async tentativeDejaFaite(
    participantId: string,
    enigmeId: string,
    valeurNormalisee: number | null,
    saisie: string,
  ): Promise<boolean> {
    const filtre =
      valeurNormalisee === null
        ? { participantId, enigmeId, saisie }
        : { participantId, enigmeId, valeurNormalisee };
    return (await this.tentatives.count({ where: filtre })) > 0;
  }

  private toDomain(
    ligne: FormationEscapeProgressEntity,
  ): ProgressionEnigmeRecord {
    return {
      participantId: ligne.participantId,
      parcoursId: ligne.parcoursId,
      enigmeId: ligne.enigmeId,
      tentatives: ligne.tentatives,
      resolueLe: ligne.resolueLe,
    };
  }
}
