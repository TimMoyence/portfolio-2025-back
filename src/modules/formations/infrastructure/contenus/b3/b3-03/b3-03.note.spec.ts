import { existsSync, readdirSync, readFileSync } from 'node:fs';
import {
  cheminDuClasseur,
  ecrireLeFichierServi,
  nomServiDe,
} from '../../../../../../../test/helpers/formations/cours/classeurs-reserves';
import {
  LIGNES_DE_LA_NOTE_B3_03,
  NOTE_B3_03,
  pourcent,
  VALEURS_B3_03,
} from './b3-03.donnees';

const BASE = 'B3-03_note_comite';
const BOM = String.fromCodePoint(0xfeff);
const LIGNE = '\r\n';
const PARAGRAPHE = '\r';
const DOSSIER = cheminDuClasseur('b3-03');

const octetsAttendus = (): Buffer =>
  Buffer.from(BOM + LIGNES_DE_LA_NOTE_B3_03.join(LIGNE.repeat(2)), 'utf8');

function ecrireLaNote(): void {
  ecrireLeFichierServi(DOSSIER, BASE, octetsAttendus(), 'txt');
}

const octetsServis = (): Buffer =>
  existsSync(cheminDuClasseur(NOTE_B3_03.reservee))
    ? readFileSync(cheminDuClasseur(NOTE_B3_03.reservee))
    : Buffer.alloc(0);

const importeeDansWord = (): string =>
  octetsServis()
    .toString('utf8')
    .replace(BOM, '')
    .replaceAll(LIGNE, PARAGRAPHE);

const occurrences = (texte: string, motif: string): number =>
  texte.split(motif).length - 1;

function remplacerTout(
  texte: string,
  motif: string,
  remplacement: string,
): { readonly texte: string; readonly remplacements: number } {
  return {
    texte: texte.replaceAll(motif, remplacement),
    remplacements: occurrences(texte, motif),
  };
}

function nettoyage() {
  const paragraphes = remplacerTout(
    importeeDansWord(),
    `${PARAGRAPHE}${PARAGRAPHE}`,
    PARAGRAPHE,
  );
  const espaces = remplacerTout(paragraphes.texte, '  ', ' ');
  const tirets = remplacerTout(espaces.texte, `${PARAGRAPHE}- `, PARAGRAPHE);
  return { paragraphes, espaces, tirets };
}

const NIVEAU_1 = /^\d+\. \S/;
const NIVEAU_2 = /^\d+\.\d+ \S/;
const LISTE = /^- \S/;
const CORPS = /^[^\d-]/;

const lignesNettoyees = (): readonly string[] =>
  nettoyage().espaces.texte.split(PARAGRAPHE);

describe('B3-03 — la note brute de Nadia Ferrand', () => {
  beforeAll(() => {
    if (process.env.ECRIRE_CLASSEURS === '1') {
      ecrireLaNote();
    }
  });

  it('B303-02 sert, octet pour octet, la note du cours en UTF-8 avec BOM et fins de ligne Windows, nommée d’après ses octets', () => {
    const octets = octetsAttendus();
    const fichier = nomServiDe(BASE, octets, 'txt');

    expect(octetsServis()).toEqual(octets);
    expect(NOTE_B3_03).toEqual({
      publique: `/assets/cours/b3-03/${fichier}`,
      reservee: `b3-03/${fichier}`,
    });
    expect(readdirSync(DOSSIER)).toEqual([fichier]);
  });

  it('B303-02 recompte dans le fichier servi, comme Word, chaque valeur que le cours note', () => {
    const { paragraphes, espaces, tirets } = nettoyage();
    const lignes = lignesNettoyees();

    expect({
      'b3-03-a1-paragraphes-vides': paragraphes.remplacements,
      'b3-03-a1-doubles-espaces': espaces.remplacements,
      'b3-03-a1-titres-1': lignes.filter((ligne) => NIVEAU_1.test(ligne))
        .length,
      'b3-03-a1-titres-2': lignes.filter((ligne) => NIVEAU_2.test(ligne))
        .length,
      'b3-03-a2-tirets': tirets.remplacements,
    }).toEqual(VALEURS_B3_03);
    expect(Object.values(VALEURS_B3_03).every((valeur) => valeur > 0)).toBe(
      true,
    );
  });

  it('B303-03 ne laisse aucune forme ambiguë : ni trois sauts ou trois espaces de suite, ni ligne vide en tête ou en fin, et chaque remplacement rejoué ne trouve plus rien', () => {
    const brut = octetsServis().toString('utf8').replace(BOM, '');
    const { paragraphes, espaces, tirets } = nettoyage();

    expect(brut.length).toBeGreaterThan(0);
    expect(occurrences(brut, `${LIGNE}${LIGNE}${LIGNE}`)).toBe(0);
    expect(occurrences(brut, '   ')).toBe(0);
    expect(brut.startsWith(LIGNE) || brut.endsWith(LIGNE)).toBe(false);
    expect(occurrences(brut, '\n') - occurrences(brut, LIGNE)).toBe(0);
    expect([
      occurrences(paragraphes.texte, `${PARAGRAPHE}${PARAGRAPHE}`),
      occurrences(espaces.texte, '  '),
      occurrences(tirets.texte, `${PARAGRAPHE}- `),
    ]).toEqual([0, 0, 0]);
  });

  it('B303-04 ne numérote que les titres, ne fait commencer par un tiret que les lignes de liste, et laisse le titre et le sous-titre sans numéro', () => {
    const lignes = lignesNettoyees();
    const formes = lignes.map((ligne) =>
      [NIVEAU_1, NIVEAU_2, LISTE, CORPS].filter((forme) => forme.test(ligne)),
    );

    expect(lignes.length).toBeGreaterThan(2);
    expect(formes.every((trouvees) => trouvees.length === 1)).toBe(true);
    expect(lignes.slice(0, 2).every((ligne) => CORPS.test(ligne))).toBe(true);
  });
});

describe('JUM-01 · pourcent du B3-03', () => {
  it.each([
    [27.25, '27,3 %'],
    [-12.04, '12,0 %'],
    [-0, '0,0 %'],
    [(0.1 + 0.2) * 100, '30,0 %'],
  ])(
    'écrit l’écart %p au dixième de point, sans son signe : %p',
    (valeur, attendue) => {
      expect(pourcent(valeur)).toBe(attendue);
    },
  );
});
