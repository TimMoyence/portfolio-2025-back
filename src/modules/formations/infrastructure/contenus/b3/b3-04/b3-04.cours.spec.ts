import { join } from 'node:path';
import {
  relireClasseur,
  type OngletCanonique,
} from '../../../../../../../test/helpers/formations/b3/b3-01/classeurs';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { pagesDessineesDe } from '../../../../../../../test/helpers/formations/cours/serie-de-pages';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { questionsDuCours } from '../../../../domain/cours/structure/Cours';
import { tirer } from '../../../../domain/cours/tirage/Tirage';
import { COURS_B3_04 } from './b3-04.cours';
import {
  ADRESSES_DE_REMPLISSAGE_B3_04,
  CLASSEURS_B3_04,
  PIECES_JOINTES_B3_04,
  PIEGES_B3_04,
  QUESTIONS_CHIFFREES_B3_04,
  VALEURS_B3_04,
} from './b3-04.donnees';

const COURS = buildCoursDuContenu(COURS_B3_04);
const ATELIER_D_ENVOI = 'B3-04-A3-04-ATELIER-ENVOI';
const ENVOI = 'b3-04-a3-envoi';
const DELAI_MS = 60_000;

const pagesDessinees = () => pagesDessineesDe(COURS_B3_04);

const proprietesDe = (screenId: string) =>
  fiche.ecranDuContenu(COURS_B3_04, screenId).proprietes;

const questionsNotees = () =>
  questionsDuCours(COURS).filter(({ noteCompte }) => noteCompte);

const colonne = (onglet: OngletCanonique, nom: string) =>
  onglet.lignes.map((ligne) => ligne[onglet.colonnes.indexOf(nom)]);

fiche.decrireLaFicheDuCours('B3-04', COURS, {
  conception: 'b3/cours-b3-04-conception.md',
  valeurs: VALEURS_B3_04,
  comptages: QUESTIONS_CHIFFREES_B3_04,
  ecrans: 34,
  dureeMinutes: 180,
  minutesParActe: [60, 60, 60, 0, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 149, exposition: 31 },
  ateliersNotes: [
    'A1-06 (14)',
    'A1-11 (15)',
    'A1-12 (12)',
    'A2-04 (15)',
    'A2-09 (15)',
    'A2-10 (14)',
    'A3-04 (14)',
    'A3-08 (11)',
  ],
  noteesParType: [7, 3, 3, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 19,
  options: 13,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-08',
    'A1-09',
    'A2-02',
    'A2-03',
    'A2-06',
    'A2-07',
    'A2-08',
    'A2-11',
    'A3-02',
    'A3-03',
    'A3-07',
    'A3-11',
  ],
  gabarit: 'b3',
  corrigesSurPlace: [
    'B3-04-A1-06-ATELIER-SOURCE',
    'B3-04-A1-11-ATELIER-LETTRE',
    'B3-04-A1-12-TRI-LETTRE',
    'B3-04-A2-04-ATELIER-FILTRE',
    'B3-04-A2-09-ATELIER-FUSION',
    'B3-04-A2-10-TRI-CORRECTIONS',
    ATELIER_D_ENVOI,
    'B3-04-A3-08-AUDIT-LETTRE-IA',
    'B3-04-A3-09-DEFI-CONSIGNE',
  ],
});

describe('B3-04 — la séance et ses classeurs', () => {
  it('B304-01 annonce la séance du jeudi 10 décembre 2026 dans l’accroche', () => {
    expect(
      feuille.proprietesV2(COURS_B3_04, 'B3-04-A1-02-ACCROCHE')['subtitle'],
    ).toContain('Jeudi 10 décembre');
  });

  it('B304-01 sert les contacts au catalogue sur l’accroche, réservés sur le vote qui suit, et le classeur d’envoi réservé au seul exercice d’envoi', () => {
    expect(PIECES_JOINTES_B3_04).toEqual({
      contacts: {
        publique: `/assets/cours/b3-04/${CLASSEURS_B3_04.contacts}`,
        reservee: `b3-04/${CLASSEURS_B3_04.contacts}`,
      },
      envoi: `b3-04/${CLASSEURS_B3_04.envoi}`,
    });
    expect(proprietesDe('B3-04-A1-02-ACCROCHE')).toMatchObject({
      pieceJointe: { fichier: PIECES_JOINTES_B3_04.contacts.publique },
    });
    expect(proprietesDe('B3-04-A1-03-VOTE-LETTRES')).toMatchObject({
      pieceJointe: {
        classeur: PIECES_JOINTES_B3_04.contacts.reservee,
        reprend: [],
      },
    });
    expect(proprietesDe(ATELIER_D_ENVOI)).toMatchObject({
      pieceJointe: { classeur: PIECES_JOINTES_B3_04.envoi, reprend: [] },
    });
    expect(
      COURS_B3_04.ecrans
        .filter((ecran) =>
          JSON.stringify(ecran).includes(CLASSEURS_B3_04.envoi),
        )
        .map(({ screenId }) => screenId),
    ).toEqual([ATELIER_D_ENVOI]);
  });
});

describe('B3-04 — les valeurs notées, recomptées dans le classeur', () => {
  it('B304-02 sert à chaque question chiffrée la valeur recomptée et ses pièges', () => {
    fiche.attendreLesNumeriques(
      COURS,
      fiche.comptagesDe(QUESTIONS_CHIFFREES_B3_04, VALEURS_B3_04, PIEGES_B3_04),
    );
  });

  it(
    'B304-02 recompte chaque piège dans le classeur des contacts relu',
    async () => {
      const { Contacts } = await relireClasseur(
        join(__dirname, '../../../classeurs/b3-04', CLASSEURS_B3_04.contacts),
      );
      const agences = colonne(Contacts, 'agence');
      const civilites = colonne(Contacts, 'civilite');

      expect(PIEGES_B3_04).toEqual({
        'b3-04-a1-contacts': {
          'ligne-d-en-tete-comptee': Contacts.lignes.length + 1,
        },
        'b3-04-a2-lettres-rennes': {
          'filtre-sur-le-mauvais-champ': colonne(Contacts, 'ville').filter(
            (ville) => ville === 'Rennes',
          ).length,
        },
        'b3-04-a2-chere-madame': {
          'condition-inversee': civilites.filter(
            (civilite, rang) => civilite === 'M.' && agences[rang] === 'Rennes',
          ).length,
        },
      });
    },
    DELAI_MS,
  );

  it('B304-02 note l’insertion des champs et la fusion par des votes sur le geste', () => {
    const votesNotes = questionsNotees()
      .filter(({ type }) => type === 'vote')
      .map(({ id }) => id);

    expect(votesNotes).toEqual(
      expect.arrayContaining([
        'b3-04-a1-inserer',
        'b3-04-a1-format-ca',
        'b3-04-a2-fusionner',
        'b3-04-a2-pdf-client',
        'b3-04-a3-envoi',
      ]),
    );
  });
});

describe('B3-04 — l’envoi', () => {
  const consigne = (): string => {
    const proprietes = proprietesDe(ATELIER_D_ENVOI);
    return 'consigne' in proprietes ? String(proprietes.consigne) : '';
  };

  it('B304-03 donne deux chemins : Outlook classique pour Windows, sinon la lettre en PDF jointe à la main', () => {
    expect(consigne()).toContain('Chemin 1 (Outlook classique pour Windows)');
    expect(consigne()).toContain('Chemin 2 (sans Outlook classique)');
    expect(consigne().indexOf('Chemin 1')).toBeLessThan(
      consigne().indexOf('Chemin 2'),
    );
  });

  it('B304-04 fait ouvrir le seul classeur d’envoi, remplacer ses deux adresses de remplissage et ne rien envoyer au-delà de deux courriels', () => {
    expect(consigne()).toContain('B3-04_envoi');
    expect(consigne()).not.toContain('B3-04_contacts');
    for (const adresse of ADRESSES_DE_REMPLISSAGE_B3_04) {
      expect(consigne()).toContain(adresse);
    }
    expect(consigne()).toContain('deux courriels au plus');
  });

  it('B304-04 note l’envoi par un vote sur le champ À, l’objet et le format, et le reçu par une check-list libre', () => {
    const { solutions, libellesOptions } = tirer(COURS, 0);
    const bonne = libellesOptions[ENVOI][String(solutions[ENVOI].valeur)] ?? '';
    const recu = proprietesDe('B3-04-A3-05-RECU');

    expect(questionsNotees().map(({ id }) => id)).toContain(ENVOI);
    expect(
      ['À :', 'Objet :', 'Format :'].filter(
        (reglage) => !bonne.includes(reglage),
      ),
    ).toEqual([]);
    expect(recu).toMatchObject({
      questionsLibres: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^b3-04-a3-recu:/u),
        }),
      ]),
    });
    expect(JSON.stringify(recu)).not.toContain('"noteCompte":true');
  });
});

describe('B3-04 — les pages dessinées', () => {
  it('PAGE-03 dit ses exemples inventés et ne montre aucune donnée du classeur des contacts', () => {
    const textes = pagesDessinees().map(({ screenId }) => ({
      screenId,
      texte: JSON.stringify(feuille.proprietesV2(COURS_B3_04, screenId)),
    }));

    expect(
      textes
        .filter(({ texte }) => !texte.includes('inventé'))
        .map(({ screenId }) => screenId),
    ).toEqual([]);
    expect(
      textes
        .filter(({ texte }) => /Norvane|CL\d{3}|@/u.test(texte))
        .map(({ screenId }) => screenId),
    ).toEqual([]);
  });
});
