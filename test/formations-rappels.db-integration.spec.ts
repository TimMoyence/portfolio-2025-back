import type { Test } from 'supertest';
import { B2_COURS_V3 } from '../src/migrations/data/b2-v3.cours';
import type { SpacedQuestionPublique } from '../src/modules/formations/domain/contrats/donnees-publiques';
import { describeDb } from './helpers/db-integration-datasource';
import {
  ADMIN_DE_TEST,
  AUTRE_FORMATEUR_DE_TEST,
  CODE_HTTP,
  installerBancDeSeance,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const DERNIER_ECRAN = B2_COURS_V3.ecrans.length - 1;

describeDb('Rappels espaces (B9, db integration)', () => {
  const banc = installerBancDeSeance({
    slug: B2_COURS_V3.slug,
    version: B2_COURS_V3.version,
    ecran: DERNIER_ECRAN,
  });

  const lireRappels = (seance: SeanceDeTest, jeton = seance.jeton): Test =>
    banc.avecJeton('get', `/sessions/${seance.sessionId}/rappels`, jeton);

  it('sert trois a quatre rappels sans jamais livrer la bonne reponse', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    });

    const reponse = await lireRappels(seance).expect(CODE_HTTP.OK);

    const { questions } = reponse.body as {
      questions: SpacedQuestionPublique[];
    };
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.length).toBeLessThanOrEqual(4);
    const brut = JSON.stringify(reponse.body);
    expect(brut).not.toContain('confusion');
    expect(brut).not.toContain('bonne');
  });

  it('fige la liste servie et la rend identique au rechargement', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
    });

    const premier = await lireRappels(seance).expect(CODE_HTTP.OK);
    const second = await lireRappels(seance).expect(CODE_HTTP.OK);

    const idsDe = (corps: unknown): string[] =>
      (corps as { questions: SpacedQuestionPublique[] }).questions.map(
        (question) => question.questionId,
      );
    expect(idsDe(second.body)).toEqual(idsDe(premier.body));
    const servis = await banc.contexte().rappels.lister(seance.participantId);
    expect(servis.map((servi) => servi.questionId)).toEqual(
      idsDe(premier.body),
    );
  });

  it('sert des listes propres a chaque participant', async () => {
    const premier = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
    });
    const second = await banc.inscrire(
      premier,
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000004',
      'Lea',
    );
    await lireRappels(premier).expect(CODE_HTTP.OK);

    await lireRappels(second).expect(CODE_HTTP.OK);

    const servisPremier = await banc
      .contexte()
      .rappels.lister(premier.participantId);
    const servisSecond = await banc
      .contexte()
      .rappels.lister(second.participantId);
    expect(servisPremier.length).toBeGreaterThan(0);
    expect(servisSecond.length).toBeGreaterThan(0);
  });

  it('refuse les rappels avant que le formateur ait projete l ecran', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000005',
    });
    await banc
      .formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: 0 })
      .expect(CODE_HTTP.SANS_CONTENU);

    const refus = await lireRappels(seance);

    expect(refus.status).toBe(CODE_HTTP.CONFLIT);
    expect((refus.body as { code?: string }).code).toBe('ECRAN_NON_SERVI');
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000006',
    });
    const autre = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000007',
    });

    const refus = await lireRappels(seance, autre.jeton);

    expect(refus.status).toBe(CODE_HTTP.NON_AUTORISE);
  });

  it('sert la carte de maitrise au formateur proprietaire et a l administrateur', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000008',
    });
    const chemin = `/sessions/${seance.sessionId}/rappels/synthese`;

    const parProprietaire = await banc
      .formateur('get', chemin)
      .expect(CODE_HTTP.OK);
    const parAdmin = await banc
      .formateur('get', chemin, `${ADMIN_DE_TEST}:admin`)
      .expect(CODE_HTTP.OK);

    const concepts = (parProprietaire.body as { concepts: unknown[] }).concepts;
    expect(concepts.length).toBeGreaterThan(0);
    expect(parAdmin.body).toEqual(parProprietaire.body);
  });

  it('refuse la carte de maitrise a un autre formateur et a un anonyme', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000009',
    });
    const chemin = `/sessions/${seance.sessionId}/rappels/synthese`;

    const parUnAutre = await banc.formateur(
      'get',
      chemin,
      `${AUTRE_FORMATEUR_DE_TEST}:teacher`,
    );
    const anonyme = await banc.anonyme('get', chemin);

    expect(parUnAutre.status).toBe(CODE_HTTP.INTERDIT);
    expect(anonyme.status).toBe(CODE_HTTP.NON_AUTORISE);
  });

  it('efface les rappels servis quand la seance est supprimee', async () => {
    const seance = await banc.ouvrirSeance({
      cle: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000010',
    });
    await lireRappels(seance).expect(CODE_HTTP.OK);

    await banc
      .contexte()
      .dataSource.query('DELETE FROM formation_sessions WHERE id = $1', [
        seance.sessionId,
      ]);

    await expect(
      banc.contexte().rappels.lister(seance.participantId),
    ).resolves.toEqual([]);
  });
});
