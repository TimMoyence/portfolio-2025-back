import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ComptesJalon } from '../domain/contrats/resultats';
import type { EtatPulse } from '../domain/contrats/pilotage';
import { ETATS_PULSE } from '../domain/contrats/pilotage';
import type {
  DeclarationDeJalon,
  IPulsesRepository,
  JalonDuParticipant,
} from '../domain/IPulses.repository';
import { FormationPulseEntity } from './entities/FormationPulse.entity';

interface LigneDeCompte {
  sondageId: string;
  etat: EtatPulse;
  total: string;
}

function comptesVides(): ComptesJalon {
  return { perdu: 0, 'ca-va': 0, clair: 0, total: 0 };
}

function regrouperLesJalons(
  lignes: readonly LigneDeCompte[],
): Readonly<Record<string, ComptesJalon>> {
  const parSondage: Record<string, ComptesJalon> = {};
  for (const ligne of lignes) {
    const courant = parSondage[ligne.sondageId] ?? comptesVides();
    const total = Number(ligne.total);
    parSondage[ligne.sondageId] = {
      ...courant,
      [ligne.etat]: courant[ligne.etat] + total,
      total: courant.total + total,
    };
  }
  return parSondage;
}

@Injectable()
export class PulsesRepositoryTypeORM implements IPulsesRepository {
  constructor(
    @InjectRepository(FormationPulseEntity)
    private readonly repo: Repository<FormationPulseEntity>,
  ) {}

  async declarer(input: DeclarationDeJalon): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(FormationPulseEntity)
      .values({ ...input, majLe: new Date() })
      .orUpdate(
        ['etat', 'maj_le'],
        ['session_id', 'cle_participant', 'sondage_id'],
      )
      .execute();
  }

  async compterParSondage(
    sessionId: string,
  ): Promise<Readonly<Record<string, ComptesJalon>>> {
    const lignes = await this.repo
      .createQueryBuilder('jalon')
      .select('jalon.sondage_id', 'sondageId')
      .addSelect('jalon.etat', 'etat')
      .addSelect('COUNT(*)', 'total')
      .where('jalon.session_id = :sessionId', { sessionId })
      .groupBy('jalon.sondage_id')
      .addGroupBy('jalon.etat')
      .getRawMany<LigneDeCompte>();
    return regrouperLesJalons(
      lignes.filter((ligne) =>
        (ETATS_PULSE as readonly string[]).includes(ligne.etat),
      ),
    );
  }

  async listerDuParticipant(
    sessionId: string,
    cleParticipant: string,
  ): Promise<readonly JalonDuParticipant[]> {
    const lignes = await this.repo.find({
      where: { sessionId, cleParticipant },
      order: { sondageId: 'ASC' },
    });
    return lignes.map((ligne) => ({
      sondageId: ligne.sondageId,
      etat: ligne.etat,
    }));
  }
}
