import request from 'supertest';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import type { SessionRecord } from '../src/modules/formations/domain/ISessions.repository';
import { CLASSEURS_B3_01 } from '../src/modules/formations/infrastructure/contenus/b3-01.donnees';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildSeanceDuCours,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import {
  buildCoursAPiecesJointes,
  buildPieceJointeReservee,
} from './factories/ecrans-stockes.factory';
import {
  buildParticipantRecord,
  createMockDepotsFormations,
} from './factories/formation.factory';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  routeFormations,
  serveurHttpDe,
  simulerSeance,
} from './helpers/formations-harness';
import { octetsDuClasseur } from './helpers/classeurs-reserves';
import { applicationDeLaSuite } from './helpers/nest-test-app';

const SECRET = 'secret-de-test-formations-assez-long-1234';
const PROPRIETAIRE_ID = 'a1111111-1111-4111-8111-111111111111';
const SESSION_ID = 'c3333333-3333-4333-8333-333333333333';
const AUTRE_SESSION_ID = 'd4444444-4444-4444-8444-444444444444';
const PARTICIPANT_ID = 'e5555555-5555-4555-8555-555555555555';
const SEED = 4242;

const PROPRIETAIRE = `${PROPRIETAIRE_ID}:teacher`;
const AUTRE_FORMATEUR = 'b2222222-2222-4222-8222-222222222222:teacher';
const ADMINISTRATEUR = 'f6666666-6666-4666-8666-666666666666:admin';
const UTILISATEUR = 'b2222222-2222-4222-8222-222222222222:user';

const COURS = lireCoursStocke(
  buildCoursAPiecesJointes(
    buildPieceJointeReservee({ classeur: CLASSEURS_B3_01.repriseActe2 }),
  ),
);
const [, REPRISE, PUBLIQUE] = COURS.ecrans.map((ecran) => ecran.id);
const OCTETS_DE_LA_REPRISE = octetsDuClasseur(CLASSEURS_B3_01.repriseActe2);

function seance(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return buildSeanceDuCours(COURS, SEED, {
    id: SESSION_ID,
    teacherId: PROPRIETAIRE_ID,
    ...overrides,
  });
}

describe('Pièces jointes réservées à la séance (e2e http socket)', () => {
  const depots = createMockDepotsFormations();
  const app = applicationDeLaSuite(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    return monterApplicationFormations(depots, creerCatalogueDeTest(COURS));
  });

  const telecharger = (chemin: string): request.Test =>
    request(serveurHttpDe(app()))
      .get(routeFormations(chemin))
      .responseType('blob');
  const jeton = (sessionId = SESSION_ID): string =>
    app().get(ParticipantTokenService).sign(sessionId, PARTICIPANT_ID, 0);
  const auPoste = (ecranId: string, jetonDuPoste = jeton()): request.Test =>
    telecharger(`/sessions/${SESSION_ID}/pieces-jointes/${ecranId}`).set(
      EN_TETE_JETON,
      jetonDuPoste,
    );
  const auPupitre = (ecranId: string, identite?: string): request.Test => {
    const requete = telecharger(
      `/sessions/${SESSION_ID}/deroule/pieces-jointes/${ecranId}`,
    );
    return identite === undefined
      ? requete
      : requete.set(EN_TETE_IDENTITE, identite);
  };
  const codeDe = (reponse: request.Response): unknown =>
    (
      JSON.parse(Buffer.from(reponse.body as Buffer).toString('utf8')) as {
        code?: string;
      }
    ).code;

  beforeEach(() => {
    simulerSeance(
      depots,
      seance(),
      buildParticipantRecord({
        id: PARTICIPANT_ID,
        sessionId: SESSION_ID,
        seed: SEED,
      }),
    );
  });

  describe('au poste du participant', () => {
    it('sert le classeur d un écran projeté, en pièce jointe privée et non mise en cache', async () => {
      const reponse = await auPoste(REPRISE).expect(200);

      expect(Buffer.from(reponse.body as Buffer)).toEqual(OCTETS_DE_LA_REPRISE);
      expect(reponse.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(reponse.headers['content-disposition']).toBe(
        'attachment; filename="B3-01_reprise_acte_2.xlsx"',
      );
      expect(reponse.headers['cache-control']).toBe('private, no-store');
    });

    it('refuse en 404 ECRAN_NON_SERVI le classeur d un écran pas encore projeté', async () => {
      depots.sessions.findById.mockResolvedValue(seance({ ecranCourant: 0 }));

      const reponse = await auPoste(REPRISE).expect(404);

      expect(codeDe(reponse)).toBe('ECRAN_NON_SERVI');
    });

    it('refuse en 404 PIECE_JOINTE_INTROUVABLE une pièce publique, que le front sert lui-même', async () => {
      const reponse = await auPoste(PUBLIQUE).expect(404);

      expect(codeDe(reponse)).toBe('PIECE_JOINTE_INTROUVABLE');
    });

    it('refuse en 401 un appel sans jeton, puis un jeton émis pour une autre séance', async () => {
      const statuts = [
        (await telecharger(`/sessions/${SESSION_ID}/pieces-jointes/${REPRISE}`))
          .status,
        (await auPoste(REPRISE, jeton(AUTRE_SESSION_ID))).status,
      ];

      expect(statuts).toEqual([401, 401]);
    });
  });

  describe('au pupitre du formateur', () => {
    it('sert le classeur au propriétaire avant sa projection, et à un administrateur', async () => {
      depots.sessions.findById.mockResolvedValue(seance({ ecranCourant: 0 }));

      const proprietaire = await auPupitre(REPRISE, PROPRIETAIRE).expect(200);
      const administrateur = await auPupitre(REPRISE, ADMINISTRATEUR);

      expect(Buffer.from(proprietaire.body as Buffer)).toEqual(
        OCTETS_DE_LA_REPRISE,
      );
      expect(proprietaire.headers['cache-control']).toBe('private, no-store');
      expect(administrateur.status).toBe(200);
    });

    it('refuse le classeur sans identité, à un utilisateur, puis à un autre formateur', async () => {
      const statuts = [
        (await auPupitre(REPRISE)).status,
        (await auPupitre(REPRISE, UTILISATEUR)).status,
        (await auPupitre(REPRISE, AUTRE_FORMATEUR)).status,
      ];

      expect(statuts).toEqual([401, 403, 403]);
    });
  });
});
