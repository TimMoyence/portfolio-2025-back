import { verifierStructure } from '../StructureCours';
import { questionsDuCours } from '../Cours';
import { tirer } from '../Tirage';
import { creerRng, creerTirage } from '../Aleatoire';
import { clesDuCorrigeDans } from '../../../../../../test/helpers/cles-du-corrige';
import { REFERENTIEL_B2 } from '../referentiel-b2';
import { B2_01_TRAITEMENT_INFORMATION_CHIFFREE } from './b2-01-traitement-information-chiffree';

const COURS = B2_01_TRAITEMENT_INFORMATION_CHIFFREE;

describe('référentiel B2', () => {
  it('conserve les cinq pôles et les cinq modules du cadre transmis', () => {
    expect(REFERENTIEL_B2.objectifsEtat.organisationContenus).toEqual([
      'Une étude des suites et des fonctions usuelles dont la maîtrise est nécessaire à ce niveau.',
      'Une étude de séries statistiques à deux variables privilégiant les exemples issus de l’économie et de la gestion.',
      'Une initiation au calcul des propositions et des prédicats, en liaison avec l’étude du modèle relationnel en gestion.',
      'Une initiation au calcul des probabilités, centrée sur la maîtrise et l’exploitation des lois fondamentales, permettant de modéliser des phénomènes aléatoires.',
      'Une valorisation des aspects numériques et graphiques pour l’ensemble du programme, une initiation à quelques méthodes élémentaires de l’analyse numérique et l’utilisation à cet effet des moyens informatiques appropriés : calculatrice programmable à écran graphique, ordinateur muni d’un tableur, de logiciels de calcul formel et d’applications (modélisation, simulation, programmation...).',
    ]);
    expect(REFERENTIEL_B2.objectifsEtat.modules).toEqual([
      "Traitement de l'information chiffrée",
      'Calcul des propositions et des prédicats',
      'Statistique descriptive',
      'Analyse de phénomènes exponentiels',
      'Probabilités 1',
    ]);
    expect(REFERENTIEL_B2.objectifsEtat.organisationEtudes).toContain(
      '1,5 heure + 0,5 heure',
    );
  });

  it('déclare exactement douze cours répartis sur les cinq modules', () => {
    expect(REFERENTIEL_B2.cours).toHaveLength(12);
    expect(new Set(REFERENTIEL_B2.cours.map((cours) => cours.slug)).size).toBe(
      12,
    );
    expect(
      new Set(REFERENTIEL_B2.cours.map((cours) => cours.module)).size,
    ).toBe(5);
    expect(REFERENTIEL_B2.cours[0]).toMatchObject({
      code: 'B2-01',
      slug: COURS.slug,
      module: 'traitement-information-chiffree',
      titre: COURS.titre,
    });
  });
});

describe('B2_01_TRAITEMENT_INFORMATION_CHIFFREE', () => {
  it('est un cours de 210 minutes avec une évaluation métier et un vrai parcours d activités', () => {
    expect(COURS).toMatchObject({
      slug: 'b2-01-traitement-information-chiffree',
      titre: "Lire et contrôler l'information chiffrée",
      niveau: 'B2',
      dureeMinutes: 210,
    });
    expect(
      COURS.ecrans.reduce((total, ecran) => total + ecran.dureeMinutes, 0),
    ).toBe(210);
    expect(COURS.ecrans).toHaveLength(60);
    expect(new Set(COURS.ecrans.map((ecran) => ecran.brique))).toEqual(
      new Set([
        'fp-recall',
        'fp-pro',
        'fp-vote',
        'fp-concept4',
        'fp-numeric',
        'questionnaire',
        'fp-plot',
        'fp-story',
        'fp-worked',
        'fp-exit',
        'fp-challenge',
        'fp-cardsort',
      ]),
    );
    expect(questionsDuCours(COURS).length).toBeGreaterThanOrEqual(18);
    expect(verifierStructure(COURS)).toEqual([]);
  });

  it('ouvre par un diagnostic, termine par un billet de sortie et relie les erreurs à une remédiation', () => {
    expect(COURS.ecrans[0].brique).toBe('fp-recall');
    expect(COURS.ecrans.at(-1)?.brique).toBe('fp-exit');
    const idsDesQuestions = questionsDuCours(COURS).map(
      (question) => question.id,
    );
    expect(new Set(idsDesQuestions).size).toBe(idsDesQuestions.length);
    expect(COURS.remediations).toEqual({
      'raisonnement-additif': 'B2-01-V2-13-CALCUL-GUIDE',
      'taux-valeur-facteur-cent': 'B2-01-V2-33-TABLEUR-GUIDE',
      'base-arrivee': 'B2-01-V2-22-TAUX-GUIDE',
      'ecart-absolu-au-lieu-du-taux': 'B2-01-V2-22-TAUX-GUIDE',
      'coefficient-confondu-avec-taux': 'B2-01-V2-23-COEFFICIENT',
      'taux-successifs-additionnes': 'B2-01-V2-29-DEBRIEF-EVOL',
      'hausse-baisse-symetriques': 'B2-01-V2-29-DEBRIEF-EVOL',
      'reciproque-meme-taux': 'B2-01-V2-55-TRANSFERT-GUIDE',
    });
    expect(COURS.ecrans.every((ecran) => ecran.notes.length > 80)).toBe(true);
  });

  it('ne divulgue aucun corrigé dans le sujet tiré', () => {
    for (let graine = 0; graine < 500; graine += 1) {
      expect(clesDuCorrigeDans(tirer(COURS, graine).sujet)).toEqual([]);
    }
  });

  it('produit des questions calculables sur toute la série de tirages', () => {
    for (let graine = 0; graine < 500; graine += 1) {
      const tirage = tirer(COURS, graine);
      expect(tirage.sujet.ecrans).toHaveLength(COURS.ecrans.length);
      expect(tirage.solutions).not.toEqual({});
    }
  });

  it('conserve les objectifs B2 dans le premier cours', () => {
    expect(REFERENTIEL_B2.cours[0].objectifs).toEqual([
      'Passer d’une partie à une proportion puis à un pourcentage.',
      'Choisir le bon total de référence et contrôler un ordre de grandeur.',
      'Présenter un résultat chiffré avec son unité et son interprétation.',
    ]);
    expect(COURS.concepts).toEqual([
      'proportion',
      'pourcentage',
      'taux-evolution',
    ]);
  });

  it('reste déterministe avec le générateur de tirage public', () => {
    const premier = creerTirage(creerRng(42));
    const second = creerTirage(creerRng(42));
    expect(premier.entier(1, 100)).toBe(second.entier(1, 100));
    expect(tirer(COURS, 42).sujet).toEqual(tirer(COURS, 42).sujet);
  });
});
