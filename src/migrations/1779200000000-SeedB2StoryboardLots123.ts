import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';
interface ScreenSeed {
  readonly position: number;
  readonly screenId: string;
  readonly brique:
    | 'fp-story'
    | 'fp-pro'
    | 'fp-worked'
    | 'fp-concept4'
    | 'fp-plot'
    | 'fp-challenge'
    | 'fp-cardsort';
  readonly dureeMinutes: number;
  readonly concepts: readonly string[];
  readonly notes: string;
  readonly proprietes: Readonly<Record<string, unknown>>;
}

const PHOTO_HERO = {
  src: 'https://images.pexels.com/photos/33175649/pexels-photo-33175649.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt: 'Documents financiers et calculatrice sur un bureau',
  legende:
    'Un nombre affiché devient une information quand son contexte est contrôlé.',
  source:
    'https://www.pexels.com/photo/business-calculation-with-financial-document-on-desk-33175649/',
};

const SCREENS: readonly ScreenSeed[] = [
  {
    position: 0,
    screenId: 'B2-01-S01-ACCROCHE',
    brique: 'fp-story',
    dureeMinutes: 2,
    concepts: ['proportion'],
    notes: 'Installer le fil rouge : lire un chiffre avant de le croire.',
    proprietes: {
      titre: 'Lire un chiffre, ce n’est pas le croire',
      paragraphes: [
        '3 h 30 pour passer d’un nombre affiché à une décision contrôlée.',
        'BTS Comptabilité et Gestion · Deuxième année',
      ],
      visuel: PHOTO_HERO,
    },
  },
  {
    position: 1,
    screenId: 'B2-01-S02-CONTRAT',
    brique: 'fp-cardsort',
    dureeMinutes: 2,
    concepts: ['proportion'],
    notes: 'Faire choisir le geste qui demande le plus d’effort personnel.',
    proprietes: {
      intitule: 'Quel geste vous demandera le plus de vigilance ?',
      cartes: [
        { id: 'lire', libelle: 'Lire le sens du chiffre' },
        { id: 'transformer', libelle: 'Transformer une relation en calcul' },
        { id: 'agregger', libelle: 'Agréger sans perdre le périmètre' },
        { id: 'juger', libelle: 'Juger une représentation' },
        { id: 'prouver', libelle: 'Contrôler et prouver' },
      ],
      categories: [{ id: 'contrat', libelle: 'Mon point de vigilance' }],
    },
  },
  {
    position: 2,
    screenId: 'B2-01-S03-PREDICTION',
    brique: 'fp-story',
    dureeMinutes: 3,
    concepts: ['proportion'],
    notes: 'Faire prédire avant de révéler les données.',
    proprietes: {
      titre: 'Quel graphique monte le plus ?',
      paragraphes: ['Votez avant de regarder la correction.'],
      qcm: {
        id: 'Q-B2-S03',
        enonce: 'Deux séries passent de 100 à 108. Que peut-on conclure ?',
        options: [
          { id: 'a', libelle: 'La série dont la pente paraît la plus forte' },
          { id: 'b', libelle: 'La série dont l’axe commence plus bas' },
          { id: 'c', libelle: 'Les deux montrent la même progression' },
          { id: 'd', libelle: 'Impossible de comparer sans le titre' },
        ],
        bonneReponse: 'c',
        retourBonne: 'Même progression : les valeurs sont identiques.',
        retourErreur:
          'L’échelle peut amplifier une impression sans changer les valeurs.',
      },
    },
  },
  {
    position: 3,
    screenId: 'B2-01-S04-AXES',
    brique: 'fp-plot',
    dureeMinutes: 3,
    concepts: ['proportion'],
    notes:
      'Faire varier l’origine pour distinguer valeur et impression visuelle.',
    proprietes: {
      titre: 'Même donnée, deux impressions',
      source: 'Données pédagogiques construites pour le storyboard.',
      abscisse: { libelle: 'Période', min: 1, max: 4 },
      ordonnee: 'Valeur observée',
      bornesOrdonnee: { minParametre: 'origine', max: 120 },
      parametres: [
        {
          cle: 'origine',
          libelle: 'Origine de l’axe vertical',
          min: 0,
          max: 98,
          pas: 1,
          defaut: 0,
        },
      ],
      series: [
        {
          id: 'serie-a',
          libelle: 'Série A',
          trait: 'plein',
          calcul: '92 + 4 * x',
        },
        {
          id: 'serie-b',
          libelle: 'Série B',
          trait: 'tirets',
          calcul: '92 + 4 * x',
        },
      ],
    },
  },
  {
    position: 4,
    screenId: 'B2-01-S05-ANATOMIE',
    brique: 'fp-challenge',
    dureeMinutes: 3,
    concepts: ['pourcentage'],
    notes: 'Faire nommer les dimensions manquantes avant toute comparaison.',
    proprietes: {
      id: 'C-B2-S05',
      enonce:
        'On vous transmet seulement « 27,6 % ». Quelle est votre première réaction ?',
      invite: 'Écrivez les informations qui manquent pour donner du sens.',
      strategies: [
        { id: 'champ', libelle: 'Quel champ ou indicateur ?' },
        { id: 'unite', libelle: 'Quelle unité et quelle base ?' },
        { id: 'periode', libelle: 'Quelle période, source et agrégation ?' },
      ],
    },
  },
  {
    position: 5,
    screenId: 'B2-01-S06-HABILLER',
    brique: 'fp-cardsort',
    dureeMinutes: 4,
    concepts: ['pourcentage'],
    notes: 'Construire la fiche d’identité d’un indicateur.',
    proprietes: {
      intitule: 'Associez chaque élément à la fiche d’identité de 27,6 %.',
      cartes: [
        { id: 'champ', libelle: 'Part du chiffre d’affaires' },
        { id: 'unite', libelle: 'Pourcentage' },
        { id: 'periode', libelle: 'Exercice 2024' },
        { id: 'source', libelle: 'Grand livre validé' },
        { id: 'base', libelle: '289 800 / 1 050 000' },
      ],
      categories: [{ id: 'fiche', libelle: 'Indicateur documenté' }],
    },
  },
  {
    position: 6,
    screenId: 'B2-01-S07-COMPATIBILITE',
    brique: 'fp-cardsort',
    dureeMinutes: 4,
    concepts: ['pourcentage'],
    notes:
      'Refuser les comparaisons qui mélangent champ, période, unité ou périmètre.',
    proprietes: {
      intitule:
        'Classez chaque comparaison : directe, après retraitement ou impossible.',
      cartes: [
        { id: 'ca-mois-annee', libelle: 'CA mensuel / CA annuel' },
        { id: 'marge-ttc', libelle: 'Marge HT / ventes TTC' },
        { id: 'periodes', libelle: '2024 / cumul janvier-juin 2025' },
        { id: 'taux', libelle: 'Taux société / taux établissement' },
      ],
      categories: [
        { id: 'directe', libelle: 'Comparaison directe' },
        { id: 'retraitement', libelle: 'Après retraitement' },
        { id: 'impossible', libelle: 'Pas comparable en l’état' },
      ],
    },
  },
  {
    position: 7,
    screenId: 'B2-01-S08-UNITES',
    brique: 'fp-cardsort',
    dureeMinutes: 3,
    concepts: ['pourcentage', 'taux-evolution'],
    notes: 'Distinguer euros, pourcentage, points et indice relatif.',
    proprietes: {
      intitule: 'Associez chaque écriture à la bonne unité de lecture.',
      cartes: [
        { id: 'euros', libelle: '18 000 €' },
        { id: 'taux', libelle: '15 %' },
        { id: 'points', libelle: '+3 points' },
        { id: 'relatif', libelle: '+25 % par rapport à 12 %' },
      ],
      categories: [
        { id: 'valeur', libelle: 'Valeur absolue' },
        { id: 'variation', libelle: 'Variation relative' },
        { id: 'ecart', libelle: 'Écart en points' },
        { id: 'indice', libelle: 'Comparaison à une base' },
      ],
    },
  },
  {
    position: 8,
    screenId: 'B2-01-S09-FONDATIONS',
    brique: 'fp-story',
    dureeMinutes: 4,
    concepts: ['pourcentage'],
    notes: 'Consolider les réflexes de lecture par un QCM court.',
    proprietes: {
      titre: 'Fondations : avant de calculer',
      paragraphes: [
        'Une bonne réponse commence souvent par une question de contexte.',
      ],
      qcm: {
        id: 'Q-B2-S09',
        enonce: '« 27,6 % » suffit-il pour analyser une performance ?',
        options: [
          { id: 'a', libelle: 'Oui, un pourcentage suffit toujours' },
          {
            id: 'b',
            libelle: 'Non, il faut le champ, la base, la période et la source',
          },
          { id: 'c', libelle: 'Oui, si le nombre est supérieur à 20 %' },
          { id: 'd', libelle: 'Non, il faut seulement le montant en euros' },
        ],
        bonneReponse: 'b',
        retourBonne:
          'Le contexte transforme un nombre en information contrôlable.',
        retourErreur:
          'Un pourcentage sans base ni période ne permet pas de conclure.',
      },
    },
  },
  {
    position: 9,
    screenId: 'B2-01-S10-CONTROLEUR',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['pourcentage', 'taux-evolution'],
    notes: 'Faire verbaliser les six gestes d’un contrôleur.',
    proprietes: {
      id: 'C-B2-S10',
      enonce:
        'Le taux passe de 27,6 % à 25,3 %. Quelle conclusion écrivez-vous ?',
      invite:
        'Rédigez une phrase avec l’écart en points et une limite de lecture.',
      strategies: [
        { id: 'definir', libelle: 'Définir le champ' },
        { id: 'comparer', libelle: 'Comparer la même base' },
        { id: 'calculer', libelle: 'Calculer l’écart' },
        { id: 'melanger', libelle: 'Ne pas mélanger les unités' },
        { id: 'sourcer', libelle: 'Sourcer les données' },
        { id: 'conclure', libelle: 'Conclure avec prudence' },
      ],
    },
  },
  {
    position: 10,
    screenId: 'B2-01-S11-C1',
    brique: 'fp-challenge',
    dureeMinutes: 3,
    concepts: ['pourcentage'],
    notes: 'Point de passage C1 : produire une première question de contrôle.',
    proprietes: {
      id: 'C1-B2',
      enonce:
        'Un tableau affiche « 4,9 » dans une colonne intitulée Performance.',
      invite:
        'Écrivez la première question que vous posez avant toute analyse.',
      strategies: [
        { id: 'unite', libelle: 'Quelle est l’unité ?' },
        { id: 'base', libelle: 'Quelle est la base de comparaison ?' },
        { id: 'source', libelle: 'Quelle est la source et la période ?' },
      ],
    },
  },
  {
    position: 11,
    screenId: 'B2-01-S12-ABSOLU-RELATIF',
    brique: 'fp-concept4',
    dureeMinutes: 3,
    concepts: ['taux-evolution'],
    notes: 'Séparer l’écart en euros du taux d’évolution.',
    proprietes: {
      parametres: [
        {
          cle: 'depart',
          libelle: 'CA de départ (€)',
          min: 0,
          max: 300000,
          pas: 1000,
          defaut: 120000,
        },
        {
          cle: 'arrivee',
          libelle: 'CA d’arrivée (€)',
          min: 0,
          max: 300000,
          pas: 1000,
          defaut: 138000,
        },
      ],
      formuleLatexSimplifie: 'arrivee - depart',
      calcul: 'arrivee - depart',
      phrase: '18 000 € est l’écart absolu ; 15 % est la variation relative.',
    },
  },
  {
    position: 12,
    screenId: 'B2-01-S13-FORMULE',
    brique: 'fp-concept4',
    dureeMinutes: 3,
    concepts: ['taux-evolution', 'coefficient-multiplicateur'],
    notes: 'Construire la formule à partir du sens de la variation.',
    proprietes: {
      parametres: [
        {
          cle: 'depart',
          libelle: 'Valeur de départ',
          min: 1,
          max: 300000,
          pas: 1000,
          defaut: 120000,
        },
        {
          cle: 'taux',
          libelle: 'Taux en %',
          min: -50,
          max: 100,
          pas: 1,
          defaut: 15,
        },
      ],
      formuleLatexSimplifie: 'depart × (1 + taux / 100)',
      calcul: 'depart * (1 + taux / 100)',
      phrase:
        'Le dénominateur est la valeur de départ ; le coefficient est 1 + taux.',
    },
  },
  {
    position: 13,
    screenId: 'B2-01-S14-CALCUL',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['taux-evolution'],
    notes: 'Faire poser les quatre éléments du calcul avant la phrase finale.',
    proprietes: {
      id: 'C-B2-S14',
      enonce:
        'Le CA passe de 120 000 € à 138 000 €. Calculez et interprétez le taux.',
      invite: 'Notez l’écart, le dénominateur, le taux et une phrase complète.',
      strategies: [
        { id: 'ecart', libelle: 'Écart : 138 000 − 120 000 = 18 000 €' },
        { id: 'base', libelle: 'Base : 120 000 €' },
        { id: 'taux', libelle: 'Taux : 18 000 / 120 000 = 15 %' },
      ],
    },
  },
  {
    position: 14,
    screenId: 'B2-01-S15-BASE',
    brique: 'fp-concept4',
    dureeMinutes: 3,
    concepts: ['taux-evolution', 'coefficient-multiplicateur'],
    notes: 'Faire retrouver une base en divisant par le coefficient.',
    proprietes: {
      parametres: [
        {
          cle: 'arrivee',
          libelle: 'Valeur après hausse',
          min: 1,
          max: 300000,
          pas: 1000,
          defaut: 138000,
        },
        {
          cle: 'coefficient',
          libelle: 'Coefficient',
          min: 0.5,
          max: 2,
          pas: 0.01,
          defaut: 1.15,
        },
      ],
      formuleLatexSimplifie: 'arrivee / coefficient',
      calcul: 'arrivee / coefficient',
      phrase:
        'Pour retrouver la base, on divise par le coefficient multiplicateur.',
    },
  },
  {
    position: 15,
    screenId: 'B2-01-S16-POINTS',
    brique: 'fp-plot',
    dureeMinutes: 4,
    concepts: ['pourcentage', 'taux-evolution'],
    notes:
      'Faire varier deux taux pour visualiser points et évolution relative.',
    proprietes: {
      titre: 'Points de pourcentage et variation relative',
      source: 'Exemple pédagogique : 12 % vers 15 %.',
      abscisse: { libelle: 'Taux initial', min: 1, max: 20 },
      ordonnee: 'Taux final',
      parametres: [
        {
          cle: 'ecart',
          libelle: 'Écart en points',
          min: 1,
          max: 8,
          pas: 1,
          defaut: 3,
        },
      ],
      series: [
        {
          id: 'final',
          libelle: 'Taux final',
          trait: 'plein',
          calcul: '12 + ecart',
        },
        {
          id: 'relatif',
          libelle: 'Repère 25 % relatif',
          trait: 'tirets',
          calcul: 'x * 1.25',
        },
      ],
    },
  },
  {
    position: 16,
    screenId: 'B2-01-S17-HAUSSE-BAISSE',
    brique: 'fp-plot',
    dureeMinutes: 3,
    concepts: ['evolutions-successives'],
    notes: 'Faire prédire pourquoi +10 % puis −10 % ne ramène pas à 100.',
    proprietes: {
      titre: 'Une hausse puis une baisse',
      source: 'Données pédagogiques construites pour le storyboard.',
      abscisse: { libelle: 'Étape', min: 0, max: 2 },
      ordonnee: 'Valeur',
      parametres: [
        {
          cle: 'base',
          libelle: 'Base',
          min: 50,
          max: 150,
          pas: 1,
          defaut: 100,
        },
        {
          cle: 'hausse',
          libelle: 'Hausse en %',
          min: 0,
          max: 30,
          pas: 1,
          defaut: 10,
        },
        {
          cle: 'baisse',
          libelle: 'Baisse en %',
          min: 0,
          max: 30,
          pas: 1,
          defaut: 10,
        },
      ],
      series: [
        {
          id: 'chaine',
          libelle: 'Valeur après chaque étape',
          trait: 'plein',
          calcul:
            'SI(x<1;base * (1 + hausse / 100) * x + base * (1 - x);base * (1 + hausse / 100) * (1 - baisse / 100))',
        },
      ],
    },
  },
  {
    position: 17,
    screenId: 'B2-01-S18-COEFFICIENTS',
    brique: 'fp-concept4',
    dureeMinutes: 3,
    concepts: ['coefficient-multiplicateur'],
    notes: 'Faire manipuler la chaîne base × coefficient.',
    proprietes: {
      parametres: [
        {
          cle: 'base',
          libelle: 'Base',
          min: 1,
          max: 1000,
          pas: 1,
          defaut: 100,
        },
        {
          cle: 'coefficient',
          libelle: 'Coefficient',
          min: 0.5,
          max: 2,
          pas: 0.01,
          defaut: 1.1,
        },
      ],
      formuleLatexSimplifie: 'base × coefficient',
      calcul: 'base * coefficient',
      phrase:
        'Le coefficient traduit l’évolution sans perdre la valeur de départ.',
    },
  },
  {
    position: 18,
    screenId: 'B2-01-S19-SUCCESSIVES',
    brique: 'fp-concept4',
    dureeMinutes: 4,
    concepts: ['evolutions-successives'],
    notes: 'Comparer addition des taux et produit des coefficients.',
    proprietes: {
      parametres: [
        {
          cle: 'base',
          libelle: 'Base',
          min: 1,
          max: 1000,
          pas: 1,
          defaut: 100,
        },
        {
          cle: 'coefficient1',
          libelle: 'Premier coefficient',
          min: 0.5,
          max: 2,
          pas: 0.01,
          defaut: 1.1,
        },
        {
          cle: 'coefficient2',
          libelle: 'Second coefficient',
          min: 0.5,
          max: 2,
          pas: 0.01,
          defaut: 0.9,
        },
      ],
      formuleLatexSimplifie: 'base × coefficient1 × coefficient2',
      calcul: 'base * coefficient1 * coefficient2',
      phrase:
        'Les coefficients se multiplient car chaque taux porte sur la valeur devenue courante.',
    },
  },
  {
    position: 19,
    screenId: 'B2-01-S20-HISTOIRE',
    brique: 'fp-story',
    dureeMinutes: 3,
    concepts: ['proportion'],
    notes: 'Relier la lecture d’un graphique à une culture de la preuve.',
    proprietes: {
      titre: 'Une bonne représentation raconte aussi ses choix',
      paragraphes: [
        'Les premiers graphiques statistiques ont rendu visibles des écarts que les tableaux masquaient.',
        'Aujourd’hui encore, le titre, les axes, la période et la source font partie du raisonnement.',
        'Référence historique : Playfair, Time Series, Wikimedia Commons.',
      ],
    },
  },
  {
    position: 20,
    screenId: 'B2-01-S21-CHALLENGE',
    brique: 'fp-cardsort',
    dureeMinutes: 4,
    concepts: ['taux-evolution', 'evolutions-successives'],
    notes: 'Choisir la méthode avant de poser les nombres.',
    proprietes: {
      intitule: 'Choisissez le bon réflexe de calcul.',
      cartes: [
        { id: 'simple', libelle: '120 000 € vers 138 000 €' },
        { id: 'points', libelle: '12 % vers 15 %' },
        { id: 'successives', libelle: '+10 % puis −10 %' },
      ],
      categories: [
        { id: 'ecart-taux', libelle: 'Écart puis taux' },
        { id: 'points-relatif', libelle: 'Points puis relatif' },
        { id: 'produit', libelle: 'Produit des coefficients' },
      ],
    },
  },
  {
    position: 21,
    screenId: 'B2-01-S22-C2',
    brique: 'fp-challenge',
    dureeMinutes: 3,
    concepts: ['taux-evolution', 'evolutions-successives'],
    notes: 'Point de passage C2 : écrire un calcul contrôlable et l’expliquer.',
    proprietes: {
      id: 'C2-B2',
      enonce:
        'Une valeur augmente de 10 %, puis baisse de 10 %. Quel résultat attendez-vous ?',
      invite: 'Écrivez le calcul par coefficients et la phrase de conclusion.',
      strategies: [
        { id: 'coefficients', libelle: '100 × 1,10 × 0,90 = 99' },
        { id: 'sens', libelle: 'La seconde baisse porte sur 110, pas sur 100' },
        {
          id: 'controle',
          libelle: 'Le résultat final est inférieur à la base',
        },
      ],
    },
  },
];

export class SeedB2StoryboardLots1231779200000 implements MigrationInterface {
  name = 'SeedB2StoryboardLots1231779200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "formation_course_contents" SET "titre" = $1, "duree_minutes" = $2 WHERE "id" = $3`,
      ['Lire et contrôler l’information chiffrée', 70, COURSE_ID],
    );
    await queryRunner.query(
      `DELETE FROM "formation_screen_contents" WHERE "course_id" = $1`,
      [COURSE_ID],
    );
    for (const screen of SCREENS) {
      await queryRunner.query(
        `INSERT INTO "formation_screen_contents" ("course_id", "position", "screen_id", "brique", "duree_minutes", "concepts", "notes", "proprietes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          COURSE_ID,
          screen.position,
          screen.screenId,
          screen.brique,
          screen.dureeMinutes,
          JSON.stringify(screen.concepts),
          screen.notes,
          JSON.stringify(screen.proprietes),
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "formation_screen_contents" WHERE "course_id" = $1`,
      [COURSE_ID],
    );
    await queryRunner.query(
      `UPDATE "formation_course_contents" SET "titre" = $1, "duree_minutes" = $2 WHERE "id" = $3`,
      ["Lire et contrôler l'information chiffrée", 90, COURSE_ID],
    );
  }
}
