import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenHash } from '../../../common/domain/crypto/TokenHash';
import { enTransactionSurLaBoite } from '../../../common/infrastructure/typeorm/verrou-de-transaction';
import type { INewsletterRepository } from '../domain/INewsletterRepository';
import type {
  LienDeConfirmation,
  NewsletterSubscriber,
} from '../domain/NewsletterSubscriber';
import { LienDeConfirmationEntity } from './entities/LienDeConfirmation.entity';
import { NewsletterSubscriberEntity } from './entities/NewsletterSubscriber.entity';

function versLeDomaine(
  entite: NewsletterSubscriberEntity,
): NewsletterSubscriber {
  return {
    email: entite.email,
    boite: entite.boite,
    locale: entite.locale,
    status: entite.status,
    jetonDeDesabonnement: entite.unsubscribeToken,
    termsVersion: entite.termsVersion,
    termsAcceptedAt: entite.termsAcceptedAt,
    dernierMailLe: entite.lastMailSentAt,
  };
}

function colonnesDe(
  abonne: NewsletterSubscriber,
): Omit<NewsletterSubscriberEntity, 'id' | 'createdAt'> {
  return {
    email: abonne.email,
    boite: abonne.boite,
    locale: abonne.locale,
    status: abonne.status,
    unsubscribeToken: abonne.jetonDeDesabonnement,
    termsVersion: abonne.termsVersion,
    termsAcceptedAt: abonne.termsAcceptedAt,
    lastMailSentAt: abonne.dernierMailLe,
  };
}

@Injectable()
export class NewsletterRepositoryTypeORM implements INewsletterRepository {
  constructor(
    @InjectRepository(NewsletterSubscriberEntity)
    private readonly abonnes: Repository<NewsletterSubscriberEntity>,
    @InjectRepository(LienDeConfirmationEntity)
    private readonly liens: Repository<LienDeConfirmationEntity>,
  ) {}

  sousVerrouDeLaBoite<T>(
    destinataire: string,
    travail: (depot: INewsletterRepository) => Promise<T>,
  ): Promise<T> {
    return enTransactionSurLaBoite(
      this.abonnes,
      destinataire,
      (abonnes) =>
        new NewsletterRepositoryTypeORM(
          abonnes,
          abonnes.manager.getRepository(LienDeConfirmationEntity),
        ),
      travail,
    );
  }

  async trouverParBoite(boite: string): Promise<NewsletterSubscriber | null> {
    const entite = await this.abonnes.findOneBy({ boite });
    return entite === null ? null : versLeDomaine(entite);
  }

  async trouverParJetonDeDesabonnement(
    jeton: string,
  ): Promise<NewsletterSubscriber | null> {
    const entite = await this.abonnes.findOneBy({ unsubscribeToken: jeton });
    return entite === null ? null : versLeDomaine(entite);
  }

  async trouverLeLien(jeton: string): Promise<LienDeConfirmation | null> {
    const entite = await this.liens.findOneBy({
      tokenHash: TokenHash.fromRaw(jeton).value,
    });
    return entite === null
      ? null
      : {
          jeton,
          boite: entite.boite,
          locale: entite.locale,
          expireLe: entite.expiresAt,
        };
  }

  async creer(abonne: NewsletterSubscriber): Promise<NewsletterSubscriber> {
    await this.abonnes.insert(colonnesDe(abonne));
    return abonne;
  }

  async mettreAJour(
    abonne: NewsletterSubscriber,
  ): Promise<NewsletterSubscriber> {
    await this.abonnes.update({ boite: abonne.boite }, colonnesDe(abonne));
    return abonne;
  }

  async enregistrerLeLien(lien: LienDeConfirmation): Promise<void> {
    await this.liens.insert({
      tokenHash: TokenHash.fromRaw(lien.jeton).value,
      boite: lien.boite,
      locale: lien.locale,
      expiresAt: lien.expireLe,
    });
  }

  async supprimerLesLiensDe(boite: string): Promise<void> {
    await this.liens.delete({ boite });
  }
}
