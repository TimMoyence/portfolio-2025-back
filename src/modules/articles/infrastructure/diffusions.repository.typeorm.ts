import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import type {
  DestinataireDeDiffusion,
  DiffusionDue,
  IDiffusionsRepository,
} from '../application/diffusion/diffusions.repository';
import type { StatutDUnDestinataire } from './entities/article-broadcast-recipient.entity';
import { ArticleEntity } from './entities/article.entity';

interface LigneDue {
  readonly id: string;
  readonly article_record_id: string;
}

interface LigneDestinataire {
  readonly id: string;
  readonly email: string;
  readonly locale: SupportedLocale;
  readonly unsubscribe_token: string;
}

@Injectable()
export class TypeOrmDiffusionsRepository implements IDiffusionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async prendreLaProchaineDue(maintenant: Date): Promise<DiffusionDue | null> {
    const lignes: LigneDue[] = await this.dataSource.query(
      `SELECT b."id", b."articleRecordId" AS "article_record_id"
       FROM "article_broadcasts" b
       JOIN "articles" a ON a."id" = b."articleRecordId"
       WHERE b."status" = 'scheduled'
         AND b."send_after" <= $1
         AND a."status" = 'published'
       ORDER BY b."send_after"
       LIMIT 1`,
      [maintenant],
    );
    const due = lignes.at(0);
    if (due === undefined) {
      return null;
    }
    const article = await this.dataSource
      .getRepository(ArticleEntity)
      .findOneByOrFail({ id: due.article_record_id });
    return { id: due.id, article };
  }

  async destinatairesEnAttente(
    diffusionId: string,
    locale: SupportedLocale,
    limite: number,
  ): Promise<readonly DestinataireDeDiffusion[]> {
    const lignes: LigneDestinataire[] = await this.dataSource.query(
      `SELECT s."id", s."email", s."locale", s."unsubscribe_token"
       FROM "newsletter_subscribers" s
       WHERE s."status" = 'confirmed'
         AND s."locale" = $2
         AND NOT EXISTS (
           SELECT 1 FROM "article_broadcast_recipients" r
           WHERE r."broadcast_id" = $1 AND r."subscriber_id" = s."id"
         )
       ORDER BY s."created_at", s."id"
       LIMIT $3`,
      [diffusionId, locale, limite],
    );
    return lignes.map((ligne) => ({
      abonneId: ligne.id,
      email: ligne.email,
      locale: ligne.locale,
      jetonDeDesabonnement: ligne.unsubscribe_token,
    }));
  }

  async reserver(diffusionId: string, abonneId: string): Promise<boolean> {
    const reservees: unknown[] = await this.dataSource.query(
      `INSERT INTO "article_broadcast_recipients" ("broadcast_id", "subscriber_id")
       SELECT b."id", s."id"
       FROM "article_broadcasts" b
       JOIN "articles" a ON a."id" = b."articleRecordId"
       JOIN "newsletter_subscribers" s ON s."locale" = a."locale"
       WHERE b."id" = $1
         AND s."id" = $2
         AND s."status" = 'confirmed'
         AND a."status" = 'published'
       ON CONFLICT ON CONSTRAINT "UQ_article_broadcast_recipient" DO NOTHING
       RETURNING "id"`,
      [diffusionId, abonneId],
    );
    return reservees.length === 1;
  }

  marquerEnvoye(diffusionId: string, abonneId: string): Promise<void> {
    return this.marquer(diffusionId, abonneId, 'sent');
  }

  marquerRefuse(diffusionId: string, abonneId: string): Promise<void> {
    return this.marquer(diffusionId, abonneId, 'refused');
  }

  private async marquer(
    diffusionId: string,
    abonneId: string,
    status: Exclude<StatutDUnDestinataire, 'sending'>,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE "article_broadcast_recipients" SET "status" = $3
       WHERE "broadcast_id" = $1 AND "subscriber_id" = $2`,
      [diffusionId, abonneId, status],
    );
  }

  async liberer(diffusionId: string, abonneId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM "article_broadcast_recipients"
       WHERE "broadcast_id" = $1 AND "subscriber_id" = $2 AND "status" = 'sending'`,
      [diffusionId, abonneId],
    );
  }

  async libererLesReservationsAbandonnees(reserveesAvant: Date): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM "article_broadcast_recipients"
       WHERE "status" = 'sending' AND "created_at" < $1`,
      [reserveesAvant],
    );
  }

  async reprogrammer(articleRecordId: string, envoiApres: Date): Promise<void> {
    await this.dataSource.query(
      `UPDATE "article_broadcasts" SET "send_after" = $2
       WHERE "articleRecordId" = $1 AND "status" = 'scheduled'`,
      [articleRecordId, envoiApres],
    );
  }

  async cloturer(diffusionId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "article_broadcasts" SET "status" = 'sent'
       WHERE "id" = $1
         AND NOT EXISTS (
           SELECT 1 FROM "article_broadcast_recipients" r
           WHERE r."broadcast_id" = $1 AND r."status" = 'sending'
         )`,
      [diffusionId],
    );
  }
}
