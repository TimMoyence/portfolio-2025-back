import type { Test } from 'supertest';
import { cleDeJalon } from '../src/modules/formations/domain/cours/CleDeJalon';
import {
  buildCoursAvecJalon,
  SONDAGE_DE_TEST,
} from './factories/cours.factory';
import {
  attendreEcranNonServi,
  attendreJetonEtrangerRefuse,
  CODE_HTTP,
  decrireSurLeDernierEcran,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecJalon({ slug: 'cours-jalons-integration' });

decrireSurLeDernierEcran(
  'Jalons de confiance anonymises (B8, db integration)',
  COURS,
  (banc) => {
    const declarer = (
      seance: SeanceDeTest,
      etat: string,
      sondageId = SONDAGE_DE_TEST,
    ): Test =>
      banc
        .avecJeton(
          'put',
          `/sessions/${seance.sessionId}/pulses/${sondageId}`,
          seance.jeton,
        )
        .send({ etat });

    it('enregistre le jalon sous la cle HMAC, sans identifiant de participant en base', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000001',
      });

      await declarer(seance, 'ca-va').expect(CODE_HTTP.SANS_CONTENU);

      const lignes: { cle_participant: string; etat: string }[] = await banc
        .contexte()
        .dataSource.query(
          'SELECT cle_participant, etat FROM formation_pulses WHERE session_id = $1',
          [seance.sessionId],
        );
      expect(lignes).toEqual([
        {
          cle_participant: cleDeJalon(seance.sessionId, seance.participantId),
          etat: 'ca-va',
        },
      ]);
      expect(lignes[0].cle_participant).not.toContain(seance.participantId);
    });

    it('garde le dernier etat declare par participant et par sondage', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000002',
      });

      await declarer(seance, 'perdu').expect(CODE_HTTP.SANS_CONTENU);
      await declarer(seance, 'clair').expect(CODE_HTTP.SANS_CONTENU);

      const comptes = await banc
        .contexte()
        .pulses.compterParSondage(seance.sessionId);
      expect(comptes[SONDAGE_DE_TEST]).toEqual({
        perdu: 0,
        'ca-va': 0,
        clair: 1,
        total: 1,
      });
    });

    it('agrege les etats de toute la classe par sondage', async () => {
      const premier = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000003',
      });
      const second = await banc.inscrire(
        premier,
        '66666666-6666-4666-8666-000000000004',
        'Lea',
      );

      await declarer(premier, 'perdu').expect(CODE_HTTP.SANS_CONTENU);
      await declarer(second, 'clair').expect(CODE_HTTP.SANS_CONTENU);

      const comptes = await banc
        .contexte()
        .pulses.compterParSondage(premier.sessionId);
      expect(comptes[SONDAGE_DE_TEST]).toEqual({
        perdu: 1,
        'ca-va': 0,
        clair: 1,
        total: 2,
      });
    });

    it('ne rend jamais l etat individuel d un autre participant', async () => {
      const premier = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000005',
      });
      const second = await banc.inscrire(
        premier,
        '66666666-6666-4666-8666-000000000006',
        'Lea',
      );
      await declarer(second, 'perdu').expect(CODE_HTTP.SANS_CONTENU);

      const lus = await banc
        .contexte()
        .pulses.listerDuParticipant(
          premier.sessionId,
          cleDeJalon(premier.sessionId, premier.participantId),
        );

      expect(lus).toEqual([]);
    });

    it('refuse un etat hors des trois valeurs admises', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000007',
      });

      const refus = await declarer(seance, 'euphorique');

      expect(refus.status).toBe(CODE_HTTP.INVALIDE);
    });

    it('refuse un sondage absent du cours', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000008',
      });

      const refus = await declarer(seance, 'ca-va', 'jalon-invente');

      expect(refus.status).toBe(CODE_HTTP.INVALIDE);
    });

    it('refuse un jalon visant un ecran non projete', async () => {
      await attendreEcranNonServi(
        banc,
        '66666666-6666-4666-8666-000000000009',
        (seance) => declarer(seance, 'ca-va'),
      );
    });

    it('refuse le jeton d un participant d une autre seance', async () => {
      await attendreJetonEtrangerRefuse(
        banc,
        [
          '66666666-6666-4666-8666-000000000010',
          '66666666-6666-4666-8666-000000000011',
        ],
        (seance) => declarer(seance, 'ca-va'),
      );
    });

    it('efface les jalons quand la seance est supprimee', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '66666666-6666-4666-8666-000000000012',
      });
      await declarer(seance, 'clair').expect(CODE_HTTP.SANS_CONTENU);

      await banc
        .contexte()
        .dataSource.query('DELETE FROM formation_sessions WHERE id = $1', [
          seance.sessionId,
        ]);

      const comptes = await banc
        .contexte()
        .pulses.compterParSondage(seance.sessionId);
      expect(comptes).toEqual({});
    });
  },
);
