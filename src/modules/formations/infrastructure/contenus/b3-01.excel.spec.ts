import { arrondirMoitieLoinDeZero } from 'portfolio-2025-partage/formule';
import {
  comparerCommeExcel,
  dateExcel,
  dateval,
  estJourOuvre,
  mediane,
  montantEnTexte,
  montantTexteVersNombre,
  nbJoursOuvres,
  nomPropre,
  serieJourOuvre,
  somme,
  supprEspace,
} from '../../../../../test/helpers/cours-b3-01/excel';

const VENDREDI_9_OCTOBRE = dateExcel(2026, 10, 9);
const SAMEDI_10_OCTOBRE = dateExcel(2026, 10, 10);
const LUNDI_12_OCTOBRE = dateExcel(2026, 10, 12);
const VENDREDI_16_OCTOBRE = dateExcel(2026, 10, 16);

describe('fonctions de classeur à la façon d’Excel', () => {
  it('numérote les dates comme Excel depuis le 30 décembre 1899', () => {
    expect(dateExcel(2025, 1, 1)).toBe(45658);
    expect(VENDREDI_9_OCTOBRE).toBe(46304);
  });

  it('reconnaît les jours ouvrés du lundi au vendredi', () => {
    expect(estJourOuvre(VENDREDI_9_OCTOBRE)).toBe(true);
    expect(estJourOuvre(SAMEDI_10_OCTOBRE)).toBe(false);
    expect(estJourOuvre(SAMEDI_10_OCTOBRE + 1)).toBe(false);
    expect(estJourOuvre(LUNDI_12_OCTOBRE)).toBe(true);
  });

  it('compte les jours ouvrés bornes comprises, comme NB.JOURS.OUVRES', () => {
    expect(nbJoursOuvres(VENDREDI_9_OCTOBRE, LUNDI_12_OCTOBRE)).toBe(2);
    expect(nbJoursOuvres(LUNDI_12_OCTOBRE, LUNDI_12_OCTOBRE)).toBe(1);
    expect(nbJoursOuvres(LUNDI_12_OCTOBRE, VENDREDI_9_OCTOBRE)).toBe(-2);
    expect(nbJoursOuvres(SAMEDI_10_OCTOBRE, SAMEDI_10_OCTOBRE + 1)).toBe(0);
  });

  it('avance de n jours ouvrés, comme SERIE.JOUR.OUVRE', () => {
    expect(serieJourOuvre(VENDREDI_9_OCTOBRE, 5)).toBe(VENDREDI_16_OCTOBRE);
    expect(serieJourOuvre(VENDREDI_9_OCTOBRE, 1)).toBe(LUNDI_12_OCTOBRE);
    expect(serieJourOuvre(SAMEDI_10_OCTOBRE, 1)).toBe(LUNDI_12_OCTOBRE);
    expect(serieJourOuvre(LUNDI_12_OCTOBRE, -1)).toBe(VENDREDI_9_OCTOBRE);
    expect(serieJourOuvre(SAMEDI_10_OCTOBRE, 0)).toBe(SAMEDI_10_OCTOBRE);
  });

  it('prend la médiane d’un nombre pair de valeurs en ignorant le texte', () => {
    expect(mediane([3, 1, 4, 2])).toBe(2.5);
    expect(mediane([5, 1, 3])).toBe(3);
    expect(mediane([9, '12', 1, null, 4])).toBe(4);
  });

  it('additionne sans les textes ni les booléens, comme SOMME sur une plage', () => {
    expect(somme([1, '1 250,00 €', 3, null, true])).toBe(4);
  });

  it('classe tout texte au-dessus de tout nombre et une cellule vide comme zéro ou texte vide', () => {
    expect(comparerCommeExcel(46304, '2026-03-15')).toBeLessThan(0);
    expect(comparerCommeExcel('05/04/26', 99999)).toBeGreaterThan(0);
    expect(comparerCommeExcel(null, '')).toBe(0);
    expect(comparerCommeExcel(null, 0)).toBe(0);
    expect(comparerCommeExcel('LILLE', 'lille')).toBe(0);
    expect(comparerCommeExcel(true, 'zzz')).toBeGreaterThan(0);
  });

  it('arrondit à mi-chemin loin de zéro, comme ARRONDI', () => {
    expect(arrondirMoitieLoinDeZero(2.675, 2)).toBeCloseTo(2.68, 10);
    expect(arrondirMoitieLoinDeZero(1.005, 2)).toBeCloseTo(1.01, 10);
    expect(arrondirMoitieLoinDeZero(-2.5, 0)).toBe(-3);
    expect(arrondirMoitieLoinDeZero(12_345, -2)).toBe(12_300);
    expect(Object.is(arrondirMoitieLoinDeZero(-0.004, 2), 0)).toBe(true);
  });

  it('normalise une ville comme NOMPROPRE(SUPPRESPACE(…))', () => {
    expect(supprEspace('  Le   Havre ')).toBe('Le Havre');
    expect(nomPropre('SAINT-ÉTIENNE')).toBe('Saint-Étienne');
    expect(nomPropre('le havre')).toBe('Le Havre');
    expect(nomPropre('l’isle')).toBe('L’Isle');
  });

  it('écrit un montant en texte à la française et le relit comme CNUM(SUBSTITUE(…))', () => {
    expect(montantEnTexte(1250)).toBe('1 250,00 €');
    expect(montantEnTexte(85.5)).toBe('85,50 €');
    expect(montantEnTexte(1_234_567.8)).toBe('1 234 567,80 €');
    expect(montantTexteVersNombre('1 250,00 €')).toBe(1250);
    expect(() => montantTexteVersNombre('mille euros')).toThrow('#VALEUR!');
  });

  it('convertit une date en texte comme DATEVAL dans un Excel français', () => {
    expect(dateval('2026-03-15')).toBe(dateExcel(2026, 3, 15));
    expect(dateval('05/04/26')).toBe(dateExcel(2026, 4, 5));
    expect(dateval('05/04/95')).toBe(dateExcel(1995, 4, 5));
    expect(() => dateval('15 mars')).toThrow('#VALEUR!');
  });

  it('refuse comme DATEVAL une date impossible, et lit l’année sur quatre chiffres', () => {
    expect(() => dateval('13/25/26')).toThrow('#VALEUR!');
    expect(() => dateval('31/02/26')).toThrow('#VALEUR!');
    expect(() => dateval('2026-02-30')).toThrow('#VALEUR!');
    expect(dateval('05/04/2026')).toBe(dateExcel(2026, 4, 5));
  });
});
