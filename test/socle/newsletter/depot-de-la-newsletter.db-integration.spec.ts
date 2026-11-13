import { createHash } from 'node:crypto';
import { ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255 } from '../../factories/comptes/verrou-par-boite.factory';
import {
  buildAbonne,
  buildLienDeConfirmation,
} from '../../factories/diffusion/newsletter.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_MIGRATIONS,
} from '../../helpers/base/db-integration-datasource';
import {
  depotDesAbonnes,
  ENTITES_DE_LA_NEWSLETTER,
} from '../../helpers/base/depot-des-abonnes';
import { boiteDeLivraison } from '../../../src/common/domain/value-objects/boite-de-livraison';

const empreinte = (jeton: string): string =>
  createHash('sha256').update(jeton).digest('hex');

describeDb('Dépôt de la newsletter sur une base migrée', () => {
  const base = baseMigreeDeLaSuite(ENTITES_DE_LA_NEWSLETTER, [
    TOUTES_LES_MIGRATIONS,
  ]);
  const depot = () => depotDesAbonnes(base());

  beforeEach(async () => {
    await base().query(
      'TRUNCATE "newsletter_confirmations", "newsletter_subscribers" CASCADE',
    );
  });

  it('NL-17 · retrouve l abonne par sa boite, alias compris, et garde son jeton de desabonnement lisible', async () => {
    const abonne = buildAbonne({
      email: 'jane.doe+news@gmail.com',
      boite: 'janedoe@gmail.com',
      locale: 'en',
      dernierMailLe: new Date('2026-11-12T10:00:00.000Z'),
    });
    await depot().creer(abonne);

    expect(await depot().trouverParBoite('janedoe@gmail.com')).toEqual(abonne);
    expect(
      await depot().trouverParJetonDeDesabonnement(abonne.jetonDeDesabonnement),
    ).toEqual(abonne);

    await depot().mettreAJour({ ...abonne, status: 'confirmed' });
    expect((await depot().trouverParBoite('janedoe@gmail.com'))?.status).toBe(
      'confirmed',
    );
  });

  it('NL-17 · refuse un second abonne sur la meme boite', async () => {
    await depot().creer(buildAbonne({ boite: 'jane@mail.com' }));

    await expect(
      depot().creer(
        buildAbonne({
          email: 'jane+bis@mail.com',
          boite: 'jane@mail.com',
          jetonDeDesabonnement: '1f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
        }),
      ),
    ).rejects.toThrow();
  });

  it('NL-08 · stocke chaque lien hache, le retrouve par son jeton en clair, et supprime ceux de la boite', async () => {
    const lien = buildLienDeConfirmation({
      boite: 'jane@mail.com',
      locale: 'en',
    });
    await depot().enregistrerLeLien(lien);
    await depot().enregistrerLeLien(
      buildLienDeConfirmation({
        jeton: '9a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d',
        boite: 'autre@mail.com',
      }),
    );

    const stockes: { token_hash: string }[] = await base().query(
      'SELECT "token_hash" FROM "newsletter_confirmations" ORDER BY "token_hash"',
    );
    expect(stockes.map(({ token_hash }) => token_hash)).not.toContain(
      lien.jeton,
    );
    expect(stockes.map(({ token_hash }) => token_hash)).toContain(
      empreinte(lien.jeton),
    );
    expect(await depot().trouverLeLien(lien.jeton)).toEqual(lien);

    await depot().supprimerLesLiensDe('jane@mail.com');
    expect(await depot().trouverLeLien(lien.jeton)).toBeNull();
    expect(
      await depot().trouverLeLien('9a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d'),
    ).not.toBeNull();
  });

  it('NL-17 · garde une boite internationalisee de plus de 255 caracteres', async () => {
    const boite = boiteDeLivraison(ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255);
    expect(boite.length).toBeGreaterThan(255);

    await depot().creer(buildAbonne({ email: 'court@exemple.fr', boite }));
    await depot().enregistrerLeLien(buildLienDeConfirmation({ boite }));

    expect((await depot().trouverParBoite(boite))?.boite).toBe(boite);
  });

  it('NL-09 · ecrit sous le verrou de la boite avec le depot de la transaction', async () => {
    const abonne = buildAbonne({ boite: 'jane@mail.com' });

    await depot().sousVerrouDeLaBoite('Jane@Mail.com', (transaction) =>
      transaction.creer(abonne),
    );

    expect(await depot().trouverParBoite('jane@mail.com')).toEqual(abonne);
  });
});
