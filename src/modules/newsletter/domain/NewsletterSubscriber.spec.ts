import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  demandeDAbonnement,
  nouveauLien,
  nouvelAbonne,
} from './NewsletterSubscriber';

const RECUE_LE = new Date('2026-11-12T10:00:00.000Z');
const SAISIE = {
  email: 'Jane.Doe+news@Gmail.com',
  locale: 'en',
  termsVersion: '2026-11-12',
  termsAcceptedAt: RECUE_LE,
};

describe('NewsletterSubscriber', () => {
  it('NL-17 · normalise l adresse et nomme sa boite de livraison', () => {
    const demande = demandeDAbonnement(SAISIE, RECUE_LE);

    expect(demande.email).toBe('jane.doe+news@gmail.com');
    expect(demande.boite).toBe('janedoe@gmail.com');
    expect(demande.locale).toBe('en');
  });

  it.each([
    ['une adresse invalide', { ...SAISIE, email: 'pas-une-adresse' }],
    ['une langue non servie', { ...SAISIE, locale: 'de' }],
    ['une version de conditions vide', { ...SAISIE, termsVersion: '' }],
    [
      'une acceptation sans date',
      { ...SAISIE, termsAcceptedAt: new Date('x') },
    ],
  ])('refuse %s', (_cas, saisie) => {
    expect(() => demandeDAbonnement(saisie, RECUE_LE)).toThrow(
      DomainValidationError,
    );
  });

  it('NL-02 · pose un abonne en attente dans la langue demandee, avec son lien de desabonnement', () => {
    const abonne = nouvelAbonne(demandeDAbonnement(SAISIE, RECUE_LE));

    expect(abonne).toEqual({
      email: 'jane.doe+news@gmail.com',
      boite: 'janedoe@gmail.com',
      locale: 'en',
      status: 'pending',
      jetonDeDesabonnement: expect.any(String) as string,
      termsVersion: '2026-11-12',
      termsAcceptedAt: RECUE_LE,
      dernierMailLe: RECUE_LE,
    });
  });

  it('NL-08 · donne a chaque lien un jeton neuf, la langue demandee et 7 jours a la seconde pres', () => {
    const demande = demandeDAbonnement(SAISIE, RECUE_LE);
    const premier = nouveauLien(demande);
    const second = nouveauLien(demande);

    expect(premier.jeton).not.toBe(second.jeton);
    expect(premier).toEqual({
      jeton: premier.jeton,
      boite: 'janedoe@gmail.com',
      locale: 'en',
      expireLe: new Date('2026-11-19T10:00:00.000Z'),
    });
  });
});
