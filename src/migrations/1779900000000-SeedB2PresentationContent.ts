import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

interface PresentationSeed {
  readonly screenId: string;
  readonly renderer:
    | 'hero'
    | 'method-path'
    | 'quiz'
    | 'chart'
    | 'grid'
    | 'comparison'
    | 'stats'
    | 'reflection'
    | 'quote'
    | 'table'
    | 'image-left'
    | 'image-right'
    | 'cta'
    | 'guide';
  readonly title?: string;
  readonly subtitle?: string;
}

const PRESENTATIONS: readonly PresentationSeed[] = [
  {
    screenId: 'B2-01-S01-ACCROCHE',
    renderer: 'hero',
    title: 'Lire un chiffre, ce n’est pas le croire',
    subtitle:
      '3 h 30 pour passer d’un nombre affiché à une décision contrôlée.',
  },
  {
    screenId: 'B2-01-S02-CONTRAT',
    renderer: 'method-path',
    title: 'Sommaire de la donnée à la décision',
    subtitle:
      'Avant de calculer, le professionnel s’accorde avec le lecteur sur ce qui est mesuré et sur ce qui pourra être conclu.',
  },
  { screenId: 'B2-01-S03-PREDICTION', renderer: 'quiz' },
  {
    screenId: 'B2-01-S04-AXES',
    renderer: 'chart',
    title: 'Même série, deux lectures visuelles',
  },
  {
    screenId: 'B2-01-S05-ANATOMIE',
    renderer: 'grid',
    title: '27,6 % : le contrat de lecture d’un taux',
    subtitle:
      'Le contrat lie le producteur de la donnée, le professionnel qui la contrôle et le décideur. Il fixe la mesure, la base, la période, le périmètre et la source.',
  },
  {
    screenId: 'B2-01-S06-HABILLER',
    renderer: 'grid',
    title: 'Fiche d’identité d’un indicateur',
    subtitle:
      'Un indicateur professionnel précise ce qui est mesuré, comparé et vérifiable.',
  },
  {
    screenId: 'B2-01-S07-COMPATIBILITE',
    renderer: 'comparison',
    title: 'Avant tout calcul : comparer la même chose',
    subtitle:
      'Un calcul juste sur des bases incompatibles produit une conclusion fausse.',
  },
  {
    screenId: 'B2-01-S08-UNITES',
    renderer: 'stats',
    title: 'Quatre écritures, quatre questions',
    subtitle:
      'Chaque écriture répond à une question différente. Les mélanger dans une note crée une ambiguïté de décision.',
  },
  { screenId: 'B2-01-S09-FONDATIONS', renderer: 'quiz' },
  {
    screenId: 'B2-01-S10-CONTROLEUR',
    renderer: 'comparison',
    title: 'Le raisonnement professionnel en six questions',
    subtitle:
      'Le calcul arrive après la définition du problème. La conclusion arrive après le contrôle.',
  },
  { screenId: 'B2-01-S11-C1', renderer: 'reflection' },
  {
    screenId: 'B2-01-S12-ABSOLU-RELATIF',
    renderer: 'stats',
    title: '120 000 € vers 138 000 € : deux questions',
    subtitle:
      'Le montant répond à « combien ? ». Le taux répond à « par rapport à quelle base ? ».',
  },
  { screenId: 'B2-01-S13-FORMULE', renderer: 'quote' },
  { screenId: 'B2-01-S14-CALCUL', renderer: 'reflection' },
  {
    screenId: 'B2-01-S15-BASE',
    renderer: 'comparison',
    title: 'Retrouver la base après +15 %',
  },
  {
    screenId: 'B2-01-S16-POINTS',
    renderer: 'chart',
    title: '12 % vers 15 % : deux réponses',
  },
  {
    screenId: 'B2-01-S17-HAUSSE-BAISSE',
    renderer: 'chart',
    title: 'Le prix monte, puis redescend : que devient la marge ?',
  },
  {
    screenId: 'B2-01-S18-COEFFICIENTS',
    renderer: 'stats',
    title: 'La machine à coefficients',
    subtitle:
      'Écrire les coefficients rend visible la base de chaque variation et permet un contrôle inverse.',
  },
  { screenId: 'B2-01-S19-SUCCESSIVES', renderer: 'quote' },
  {
    screenId: 'B2-01-S20-HISTOIRE',
    renderer: 'comparison',
    title: 'Du calcul à la décision : préparer la lecture graphique',
    subtitle: 'Une représentation vient après la question, pas avant.',
  },
  {
    screenId: 'B2-01-S21-METHODE',
    renderer: 'comparison',
    title: 'Quelle méthode répond à quelle question ?',
  },
  { screenId: 'B2-01-S22-C2', renderer: 'reflection' },
  { screenId: 'B2-01-S23-INFLATION', renderer: 'quiz' },
  {
    screenId: 'B2-01-S24-SOURCE-INFLATION',
    renderer: 'table',
    title: 'Lire la source avant la courbe',
    subtitle:
      'La série combine un taux annuel et un indice base 100. Le premier décrit le rythme ; le second décrit le niveau atteint.',
  },
  { screenId: 'B2-01-S25-DESINFLATION', renderer: 'quiz' },
  {
    screenId: 'B2-01-S26-RYTHME',
    renderer: 'chart',
    title: 'Le taux mesure le rythme annuel',
  },
  {
    screenId: 'B2-01-S27-INDICE',
    renderer: 'chart',
    title: 'L’indice mesure le niveau cumulé',
  },
  { screenId: 'B2-01-S28-CONCLUSION-INFLATION', renderer: 'reflection' },
  {
    screenId: 'B2-01-S29-PAUSE',
    renderer: 'grid',
    title: 'Pause et reprise',
    subtitle:
      'Votre travail est sauvegardé. Reprenez avec le concept qui sécurise le plus votre prochaine décision chiffrée.',
  },
  {
    screenId: 'B2-01-S30-PLAYFAIR',
    renderer: 'image-left',
    title: 'En 1786, le graphique devient un langage',
    subtitle:
      'Après le calcul, le graphique rend une relation visible sans remplacer la source.',
  },
  { screenId: 'B2-01-S31-RELECTURE', renderer: 'quiz' },
  {
    screenId: 'B2-01-S32-AMPLITUDE',
    renderer: 'chart',
    title: 'Même valeur, échelle différente',
  },
  {
    screenId: 'B2-01-S33-FORME',
    renderer: 'comparison',
    title: 'Choisir une forme pour une question',
    subtitle:
      'Le type de graphique est une décision de communication. Il dépend de la relation que le lecteur doit vérifier.',
  },
  {
    screenId: 'B2-01-S34-TITRE',
    renderer: 'grid',
    title: 'Le titre oriente la lecture',
    subtitle: 'Un titre professionnel décrit avant d’interpréter.',
  },
  { screenId: 'B2-01-S35-CORRELATION', renderer: 'quiz' },
  {
    screenId: 'B2-01-S36-NIGHTINGALE',
    renderer: 'image-right',
    title: 'Florence Nightingale : faire décider par les données',
  },
  {
    screenId: 'B2-01-S37-AUDIT-GRAPHIQUE',
    renderer: 'grid',
    title: 'Audit express du graphique',
    subtitle:
      'Cochez le premier défaut avant de discuter de la pente. Un graphique fiable permet ensuite d’expliquer un total et ses écarts.',
  },
  { screenId: 'B2-01-S38-MIX', renderer: 'quiz' },
  {
    screenId: 'B2-01-S39-PREVISION-MIX',
    renderer: 'comparison',
    title: 'Prévoir l’effet du mix',
    subtitle:
      'Avant la formule, regardez quel canal gagne ou perd du poids et comparez son taux local au taux global.',
  },
  { screenId: 'B2-01-S40-PONDEREE', renderer: 'quote' },
  {
    screenId: 'B2-01-S41-SIMULATEUR-MIX',
    renderer: 'chart',
    title: 'Quand la plateforme pèse plus, le taux global baisse',
  },
  {
    screenId: 'B2-01-S42-VALEUR-TAUX',
    renderer: 'comparison',
    title: 'Valeur et taux ne racontent pas la même chose',
    subtitle:
      'La valeur mesure un montant créé. Le taux mesure une efficacité relative par rapport à une base.',
  },
  { screenId: 'B2-01-S43-MARGE-2024', renderer: 'reflection' },
  { screenId: 'B2-01-S44-MARGE-2025', renderer: 'reflection' },
  { screenId: 'B2-01-S45-RECOMMANDATION', renderer: 'reflection' },
  { screenId: 'B2-01-S46-VOTE-1', renderer: 'quiz' },
  { screenId: 'B2-01-S47-PAIRS', renderer: 'reflection' },
  { screenId: 'B2-01-S48-VOTE-2', renderer: 'quiz' },
  {
    screenId: 'B2-01-S49-DEBRIEF',
    renderer: 'comparison',
    title: 'Passer d’une intuition à une preuve',
    subtitle:
      'Un argument comptable doit contenir un mécanisme et un exemple chiffré vérifiable.',
  },
  {
    screenId: 'B2-01-S50-PACIOLI',
    renderer: 'image-left',
    title: '1494 : une méthode de contrôle',
    subtitle: 'Les traces comptables doivent se répondre.',
  },
  {
    screenId: 'B2-01-S51-MISSION',
    renderer: 'comparison',
    title: 'Mission de contrôle : choisir le premier test',
    subtitle:
      'On commence par le contrôle qui réduit le plus vite l’incertitude avec un coût raisonnable.',
  },
  {
    screenId: 'B2-01-S52-CONTROLE-GLOBAL',
    renderer: 'table',
    title: 'Contrôle global : calculer l’écart',
    subtitle:
      'Le total permet de détecter une incohérence. Il ne permet pas encore de localiser l’erreur.',
  },
  {
    screenId: 'B2-01-S53-LOCALISER',
    renderer: 'table',
    title: 'Filtrer les lignes non concordantes',
    subtitle:
      'Le filtre transforme un écart global en piste de contrôle précise.',
  },
  { screenId: 'B2-01-S54-MULTIPLE-NEUF', renderer: 'quiz' },
  {
    screenId: 'B2-01-S55-F004',
    renderer: 'table',
    title: 'Prouver avec F004',
    subtitle:
      'La pièce source est indépendante de l’écriture contrôlée. Elle permet de dire quelle valeur doit être retenue.',
  },
  {
    screenId: 'B2-01-S56-TVA',
    renderer: 'comparison',
    title: 'Recalculer TVA et TTC',
    subtitle:
      'Après correction du HT, on reconstruit la TVA et le TTC puis on effectue un contrôle inverse.',
  },
  { screenId: 'B2-01-S57-COMPENSATION', renderer: 'quiz' },
  { screenId: 'B2-01-S58-ALERTE', renderer: 'reflection' },
  {
    screenId: 'B2-01-S59-DEFI',
    renderer: 'hero',
    title: 'Mission intégrée : prioriser ce qui peut changer une décision',
    subtitle:
      'Tableau de bord Nova Services · trimestre 2 · six indicateurs à sécuriser',
  },
  {
    screenId: 'B2-01-S60-PRIORITES',
    renderer: 'grid',
    title: 'Prioriser les anomalies',
    subtitle:
      'Choisissez trois priorités et reliez chacune à la compétence concernée.',
  },
  {
    screenId: 'B2-01-S61-CONTROLE',
    renderer: 'comparison',
    title: 'Choisir le contrôle discriminant',
  },
  { screenId: 'B2-01-S62-DECISION', renderer: 'reflection' },
  { screenId: 'B2-01-S63-FLASH-POINTS', renderer: 'quiz' },
  { screenId: 'B2-01-S64-FLASH-PREUVE', renderer: 'quiz' },
  {
    screenId: 'B2-01-S65-MAITRISE',
    renderer: 'grid',
    title: 'Carte de maîtrise',
    subtitle:
      'Les cinq compétences se lisent comme une carte de progression : comprendre, appliquer, justifier puis transférer.',
  },
  {
    screenId: 'B2-01-S66-SORTIE',
    renderer: 'cta',
    title: 'Du cours au poste de travail',
  },
  {
    screenId: 'B2-01-S67-BOITE-A-OUTILS',
    renderer: 'guide',
    title: 'Le cycle de travail du futur comptable',
    subtitle:
      'Le logiciel accélère la manipulation. Le professionnel reste responsable du sens, du contrôle et de la décision.',
  },
  {
    screenId: 'B2-01-S68-TABLEUR-BI',
    renderer: 'guide',
    title: 'Du fichier brut au tableau de bord',
    subtitle:
      'Excel, Power Query, Power Pivot et Power BI répondent à des niveaux différents du même problème.',
  },
  {
    screenId: 'B2-01-S69-FORMULES',
    renderer: 'guide',
    title: 'Les formules qu’il faut savoir expliquer',
    subtitle:
      'Un futur comptable n’a pas besoin de mémoriser toutes les fonctions. Il doit savoir choisir, tester et documenter les bonnes.',
  },
  {
    screenId: 'B2-01-S70-IA-CONTROLE',
    renderer: 'guide',
    title: 'IA : accélérer la préparation, jamais déléguer le jugement',
    subtitle:
      'L’IA générative peut proposer une structure ou une variante. Elle ne valide ni un chiffre, ni une pièce, ni une conclusion.',
  },
  {
    screenId: 'B2-01-S71-SKILLS-IA',
    renderer: 'guide',
    title: 'Les skills IA du comptable augmenté',
    subtitle:
      'Le bon usage n’est pas un prompt isolé. C’est une nouvelle manière de cadrer, vérifier et communiquer le travail.',
  },
  {
    screenId: 'B2-01-S72-RESSOURCES',
    renderer: 'grid',
    title: 'Ressources pour continuer',
    subtitle:
      'Les outils et cadres de référence qui prolongent ce cours. Ouvrez les ressources selon votre objectif.',
  },
];

export class SeedB2PresentationContent1779900000000 implements MigrationInterface {
  name = 'SeedB2PresentationContent1779900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const presentation of PRESENTATIONS) {
      await queryRunner.query(
        `UPDATE "formation_screen_contents"
         SET "proprietes" = jsonb_set(
           COALESCE("proprietes", '{}'::jsonb),
           '{presentation}',
           $1::jsonb,
           true
         )
         WHERE "course_id" = $2 AND "screen_id" = $3`,
        [
          JSON.stringify({ version: 1, ...presentation }),
          COURSE_ID,
          presentation.screenId,
        ],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "formation_screen_contents"
       SET "proprietes" = "proprietes" - 'presentation'
       WHERE "course_id" = $1`,
      [COURSE_ID],
    );
  }
}
