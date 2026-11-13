import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { pagesDessineesDe } from '../../../../../../../test/helpers/formations/cours/serie-de-pages';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import { COURS_B3_03 } from './b3-03.cours';
import {
  LIGNES_DE_LA_NOTE_B3_03,
  NOTE_B3_03,
  PIEGES_B3_03,
  QUESTIONS_CHIFFREES_B3_03,
  VALEURS_B3_03,
} from './b3-03.donnees';

const COURS = buildCoursDuContenu(COURS_B3_03);

const pagesDessinees = () => pagesDessineesDe(COURS_B3_03);

const enMinuscules = (texte: string): string => texte.toLocaleLowerCase('fr');

fiche.decrireLaFicheDuCours('B3-03', COURS, {
  conception: 'b3/cours-b3-03-conception.md',
  valeurs: VALEURS_B3_03,
  comptages: QUESTIONS_CHIFFREES_B3_03,
  ecrans: 35,
  dureeMinutes: 180,
  minutesParActe: [60, 60, 60, 0, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 146, exposition: 34 },
  ateliersNotes: [
    'A1-06 (14)',
    'A1-12 (15)',
    'A1-13 (10)',
    'A2-04 (9)',
    'A2-09 (14)',
    'A2-10 (9)',
    'A2-13 (8)',
    'A3-04 (11)',
  ],
  noteesParType: [5, 5, 3, 0, 0],
  enigmes: 0,
  rappels: 0,
  remediations: 17,
  options: 11,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-08',
    'A1-09',
    'A1-10',
    'A2-02',
    'A2-03',
    'A2-06',
    'A2-07',
    'A2-08',
    'A2-12',
    'A2-14',
    'A3-02',
    'A3-03',
    'A3-08',
  ],
  gabarit: 'b3',
  corrigesSurPlace: [
    'B3-03-A1-06-ATELIER-NETTOYAGE',
    'B3-03-A1-12-ATELIER-STYLES',
    'B3-03-A1-13-TRI-MISE-EN-FORME',
    'B3-03-A2-04-ATELIER-PARAGRAPHES',
    'B3-03-A2-09-ATELIER-MISE-EN-PAGE',
    'B3-03-A2-10-TRI-REGLAGES',
    'B3-03-A2-13-ATELIER-PDF',
    'B3-03-A3-04-AUDIT-TEXTE-IA',
    'B3-03-A3-05-DEFI-CONSIGNE',
    'B3-03-A3-07-RESUME-COMITE',
  ],
});

describe('B3-03 — la séance et sa note', () => {
  it('B303-01 annonce la séance du mardi 8 décembre 2026 dans l’accroche', () => {
    expect(
      feuille.proprietesV2(COURS_B3_03, 'B3-03-A1-02-ACCROCHE')['subtitle'],
    ).toContain('Mardi 8 décembre');
  });

  it('B303-01 sert la note brute au catalogue sur l’accroche, et réservée à la séance sur le vote qui suit', () => {
    const pieceDe = (screenId: string) =>
      fiche.ecranDuContenu(COURS_B3_03, screenId).proprietes;

    expect(pieceDe('B3-03-A1-02-ACCROCHE')).toMatchObject({
      pieceJointe: { fichier: NOTE_B3_03.publique },
    });
    expect(pieceDe('B3-03-A1-03-VOTE-LIGNES-VIDES')).toMatchObject({
      pieceJointe: { classeur: NOTE_B3_03.reservee, reprend: [] },
    });
  });
});

describe('B3-03 — les valeurs notées, recomptées dans la note', () => {
  it('B303-02 sert à chaque question chiffrée la valeur recomptée et ses pièges', () => {
    fiche.attendreLesNumeriques(
      COURS,
      fiche.comptagesDe(QUESTIONS_CHIFFREES_B3_03, VALEURS_B3_03, PIEGES_B3_03),
    );
  });
});

describe('B3-03 — les pages dessinées', () => {
  it('PAGE-03 ne reproduit sur aucune page le texte ou les titres de la note servie, et dit ses exemples inventés', () => {
    const titres = LIGNES_DE_LA_NOTE_B3_03.filter((ligne) =>
      /^\d/.test(ligne),
    ).map((ligne) => ligne.replace(/^[\d.]+ /, ''));
    const reprises = pagesDessinees().flatMap(({ screenId }) => {
      const texte = enMinuscules(
        JSON.stringify(feuille.proprietesV2(COURS_B3_03, screenId)),
      );
      return [...LIGNES_DE_LA_NOTE_B3_03, ...titres]
        .filter((ligne) => texte.includes(enMinuscules(ligne)))
        .map((ligne) => `${screenId} : ${ligne}`);
    });

    expect(reprises).toEqual([]);
    expect(
      pagesDessinees()
        .filter(
          ({ screenId }) =>
            !JSON.stringify(
              feuille.proprietesV2(COURS_B3_03, screenId),
            ).includes('inventé'),
        )
        .map(({ screenId }) => screenId),
    ).toEqual([]);
  });
});
