import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';

const NOTES: Readonly<Record<string, string>> = {
  'B2-01-S01-ACCROCHE':
    'Objectif : distinguer chiffre affiché et information vérifiée. À dire : une décision commence par la question, la base et la source.',
  'B2-01-S02-CONTRAT':
    'Objectif : installer les six gestes du cours. Question : lequel demande le plus de contrôle dans votre pratique ? Transition : éprouver ce réflexe sur une courbe.',
  'B2-01-S04-AXES':
    'Objectif : séparer valeurs et perception. À dire : deux axes peuvent raconter différemment la même série. Relance : quelles bornes changent ?',
  'B2-01-S05-ANATOMIE':
    'Objectif : identifier mesure, base, période, périmètre et source. Question : que manque-t-il à 27,6 % pour décider ?',
  'B2-01-S06-HABILLER':
    'Objectif : construire la fiche d’identité d’un indicateur. À dire : nommer unité, période et source avant tout calcul.',
  'B2-01-S07-COMPATIBILITE':
    'Objectif : tester la compatibilité des bases. Erreur typique : comparer des périodes ou périmètres différents comme s’ils étaient identiques.',
  'B2-01-S08-UNITES':
    'Objectif : distinguer euros, pourcentage, points et indice. Relance : quelle question chaque écriture permet-elle de trancher ?',
  'B2-01-S10-CONTROLEUR':
    'Objectif : dérouler les six questions du contrôleur. À dire : le calcul vient après la définition du problème et avant la conclusion.',
  'B2-01-S11-C1':
    'Objectif : vérifier la lecture critique. Question : quelle première demande adresser au producteur du chiffre ? Attendu : base, unité ou source justifiée.',
  'B2-01-S12-ABSOLU-RELATIF':
    'Objectif : séparer écart absolu et taux. Calcul : 138 000 − 120 000 = 18 000 € ; 18 000 / 120 000 = 15 %.',
  'B2-01-S13-FORMULE':
    'Objectif : faire dériver la formule du sens. À dire : taux = variation / valeur de départ ; vérifier toujours le dénominateur.',
  'B2-01-S14-CALCUL':
    'Objectif : rendre un calcul contrôlable. Question : quelles sont la base, l’opération, l’unité et la phrase de conclusion ?',
  'B2-01-S15-BASE':
    'Objectif : retrouver la valeur initiale. Calcul : valeur de départ = valeur finale / coefficient ; contrôler par l’opération inverse.',
  'B2-01-S16-POINTS':
    'Objectif : distinguer points et variation relative. Calcul : 15 % − 12 % = 3 points ; 3 / 12 = 25 % de hausse relative.',
  'B2-01-S17-HAUSSE-BAISSE':
    'Objectif : défaire la fausse symétrie. Calcul : 100 × 1,10 × 0,90 = 99, pas 100. Erreur : additionner les taux.',
  'B2-01-S18-COEFFICIENTS':
    'Objectif : enchaîner et inverser les coefficients. Question : quelle base reçoit la deuxième variation ?',
  'B2-01-S19-SUCCESSIVES':
    'Objectif : composer des variations. À dire : multiplier les coefficients puis retirer 1 pour retrouver le taux global.',
  'B2-01-S20-HISTOIRE':
    'Objectif : relier graphique et culture de la preuve. À dire : la représentation vient après la question, jamais à sa place.',
  'B2-01-S21-METHODE':
    'Objectif : choisir une méthode selon la question. Relance : cherche-t-on un niveau, une variation, une part ou un contrôle ?',
  'B2-01-S22-C2':
    'Objectif : faire produire un calcul explicable. Attendu : base et opération visibles, unité puis interprétation prudente.',
  'B2-01-S24-SOURCE-INFLATION':
    'Objectif : lire la source avant la courbe. Question : le taux annuel mesure-t-il le niveau des prix ou leur rythme ?',
  'B2-01-S26-RYTHME':
    'Objectif : distinguer ralentissement et baisse. À dire : un taux positif plus faible décrit une hausse qui continue.',
  'B2-01-S27-INDICE':
    'Objectif : lire un indice cumulé base 100. Relance : que devient l’indice tant que les taux successifs restent positifs ?',
  'B2-01-S28-CONCLUSION-INFLATION':
    'Objectif : écrire une conclusion défendable. Attendu : la hausse ralentit mais le niveau des prix augmente encore.',
  'B2-01-S29-PAUSE':
    'Objectif : consolider avant la suite. Question : quel concept devez-vous encore pouvoir expliquer sans support ?',
  'B2-01-S30-PLAYFAIR':
    'Objectif : introduire le graphique comme langage. À dire : la forme accélère la lecture, la source permet la vérification.',
  'B2-01-S32-AMPLITUDE':
    'Objectif : mesurer l’effet de l’échelle. Relance : la valeur change-t-elle quand seule l’amplitude de l’axe change ?',
  'B2-01-S33-FORME':
    'Objectif : choisir une forme adaptée. Question : comparaison, composition ou évolution — quelle relation veut-on montrer ?',
  'B2-01-S34-TITRE':
    'Objectif : distinguer description et interprétation. Erreur typique : titrer la conclusion avant de contrôler la série.',
  'B2-01-S36-NIGHTINGALE':
    'Objectif : montrer une représentation au service d’une décision. À dire : expliciter les données et la limite avant l’appel à agir.',
  'B2-01-S37-AUDIT-GRAPHIQUE':
    'Objectif : auditer un graphique rapidement. Question : quel défaut de repère ou de source vérifier en premier ?',
  'B2-01-S39-PREVISION-MIX':
    'Objectif : prédire un effet de composition. Attendu : le taux global peut baisser si le canal moins rentable gagne du poids.',
  'B2-01-S40-PONDEREE':
    'Objectif : formuler la moyenne pondérée. Calcul : somme des valeurs / somme des bases, non moyenne simple des taux.',
  'B2-01-S41-SIMULATEUR-MIX':
    'Objectif : tester l’effet des poids. Relance : quels taux locaux restent fixes quand le taux global change ?',
  'B2-01-S42-VALEUR-TAUX':
    'Objectif : séparer marge en euros et taux de marge. À dire : volume et efficacité relative répondent à deux questions.',
  'B2-01-S43-MARGE-2024':
    'Objectif : poser le point de départ du mix. Question : quelles valeurs et quels poids faut-il conserver pour comparer 2025 ?',
  'B2-01-S44-MARGE-2025':
    'Objectif : recalculer le mix. Attendu : contributions par canal, marge totale puis taux global sur le bon dénominateur.',
  'B2-01-S45-RECOMMANDATION':
    'Objectif : passer du calcul à une recommandation. Attendu : mécanisme, chiffre de contrôle et limite explicites.',
  'B2-01-S47-PAIRS':
    'Objectif : faire argumenter deux élèves. Relance : votre preuve explique-t-elle le changement de poids et son effet ?',
  'B2-01-S49-DEBRIEF':
    'Objectif : relier intuition et preuve. À dire : un argument de mix comporte un mécanisme et un exemple chiffré.',
  'B2-01-S51-MISSION':
    'Objectif : choisir le premier contrôle utile. Question : quel test réduit le plus vite l’incertitude sur la décision ?',
  'B2-01-S52-CONTROLE-GLOBAL':
    'Objectif : détecter l’écart total. Calcul : comparer somme des lignes et total attendu ; ne pas prétendre localiser l’erreur.',
  'B2-01-S53-LOCALISER':
    'Objectif : localiser une ligne non concordante. À dire : filtrer transforme l’écart global en piste vérifiable.',
  'B2-01-S55-F004':
    'Objectif : confronter l’écriture à une pièce indépendante. Attendu : identifier la valeur prouvée par F004.',
  'B2-01-S56-TVA':
    'Objectif : reconstruire HT, TVA et TTC. Calcul : recalculer la TVA après correction du HT puis contrôler le total inverse.',
  'B2-01-S58-ALERTE':
    'Objectif : rédiger une alerte exploitable. Attendu : anomalie, pièce, impact, action et niveau de confiance.',
  'B2-01-S59-DEFI':
    'Objectif : poser la mission intégrée. À dire : prioriser les anomalies qui peuvent changer la décision.',
  'B2-01-S60-PRIORITES':
    'Objectif : classer trois anomalies. Relance : quelle compétence et quel risque justifient chaque priorité ?',
  'B2-01-S61-CONTROLE':
    'Objectif : choisir un contrôle discriminant. Question : quelle preuve départagerait les hypothèses ?',
  'B2-01-S62-DECISION':
    'Objectif : conclure la mission. Attendu : décision conditionnelle, contrôle réalisé et limite restante.',
  'B2-01-S65-MAITRISE':
    'Objectif : situer la progression sur cinq compétences. Question : laquelle faut-il transférer au poste de travail ?',
  'B2-01-S66-SORTIE':
    'Objectif : organiser le transfert. À dire : réutiliser le cycle question, calcul, contrôle, conclusion.',
  'B2-01-S67-BOITE-A-OUTILS':
    'Objectif : choisir l’outil sans perdre le jugement. Relance : quel contrôle humain reste obligatoire ?',
  'B2-01-S68-TABLEUR-BI':
    'Objectif : distinguer fichier, transformation, modèle et tableau de bord. À dire : documenter source et version.',
  'B2-01-S69-FORMULES':
    'Objectif : expliquer les formules utiles. Question : comment tester et documenter une formule avant de la réutiliser ?',
  'B2-01-S70-IA-CONTROLE':
    'Objectif : cadrer l’usage de l’IA. À dire : elle propose, le professionnel vérifie chiffres, pièces et conclusion.',
  'B2-01-S71-SKILLS-IA':
    'Objectif : structurer un usage répétable de l’IA. Relance : quelles entrées, vérifications et sorties faut-il imposer ?',
  'B2-01-S72-RESSOURCES':
    'Objectif : prolonger le cours. Question : quelle ressource répond à votre prochain besoin concret ?',
};

interface ScreenRow {
  readonly screen_id: string;
  readonly proprietes: {
    readonly guide?: {
      readonly aDire?: string;
      readonly question?: string;
      readonly reponse?: string;
      readonly calcul?: string;
      readonly relance?: string;
      readonly transition?: string;
    };
  };
}

function notesDuGuide(
  guide: NonNullable<ScreenRow['proprietes']['guide']>,
): string {
  return [
    ['À dire', guide.aDire],
    ['Question', guide.question],
    ['Attendu', guide.reponse],
    ['Calcul', guide.calcul],
    ['Relance', guide.relance],
    ['Transition', guide.transition],
  ]
    .filter(
      (entree): entree is [string, string] =>
        typeof entree[1] === 'string' && entree[1].trim().length > 0,
    )
    .map(([rubrique, texte]) => `${rubrique} : ${texte}`)
    .join('\n');
}

export class SeedB2PresentationNotes1780060000000 implements MigrationInterface {
  name = 'SeedB2PresentationNotes1780060000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const ecrans = (await queryRunner.query(
      `SELECT "screen_id", "proprietes" FROM "formation_screen_contents" WHERE "course_id" = $1`,
      [COURSE_ID],
    )) as ScreenRow[];
    if (ecrans.length !== 72) {
      throw new Error(
        `Notes B2 : 72 écrans attendus, ${ecrans.length} trouvés`,
      );
    }
    for (const ecran of ecrans) {
      const notes = ecran.proprietes.guide
        ? notesDuGuide(ecran.proprietes.guide)
        : NOTES[ecran.screen_id];
      if (!notes?.trim()) {
        throw new Error(`Notes B2 manquantes pour ${ecran.screen_id}`);
      }
      await queryRunner.query(
        `UPDATE "formation_screen_contents" SET "notes" = $1 WHERE "course_id" = $2 AND "screen_id" = $3`,
        [notes, COURSE_ID, ecran.screen_id],
      );
    }
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD CONSTRAINT "chk_formation_screen_notes_not_blank" CHECK (length(btrim("notes")) > 0)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP CONSTRAINT "chk_formation_screen_notes_not_blank"`,
    );
    await queryRunner.query(
      `UPDATE "formation_screen_contents" SET "notes" = '' WHERE "course_id" = $1`,
      [COURSE_ID],
    );
  }
}
