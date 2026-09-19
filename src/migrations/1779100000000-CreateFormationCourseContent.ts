import { MigrationInterface, QueryRunner } from 'typeorm';

const COURSE_ID = '00000000-0000-4000-8000-000000000201';
const SLUG = 'b2-01-traitement-information-chiffree';

interface ScreenSeed {
  position: number;
  screenId: string;
  brique: 'fp-story' | 'fp-pro';
  dureeMinutes: number;
  concepts: readonly string[];
  notes: string;
  proprietes: Readonly<Record<string, unknown>>;
}

const SCREENS: readonly ScreenSeed[] = [
  {
    position: 0,
    screenId: 'B2-01-01-CADRAGE',
    brique: 'fp-story',
    dureeMinutes: 6,
    concepts: ['proportion'],
    notes: 'Poser le fil rouge : lire avant de calculer.',
    proprietes: {
      titre: 'Un chiffre n’est pas encore une information',
      paragraphes: [
        'Un tableau peut être exact et pourtant conduire à une mauvaise décision.',
        'La première compétence consiste à identifier ce que mesure chaque nombre, à qui il se rapporte et dans quelle unité.',
      ],
    },
  },
  {
    position: 1,
    screenId: 'B2-01-02-MISSION',
    brique: 'fp-pro',
    dureeMinutes: 8,
    concepts: ['proportion'],
    notes: 'Faire nommer la question métier avant la formule.',
    proprietes: {
      metier: 'Contrôle de gestion',
      situation:
        'Une direction reçoit un total de ventes et plusieurs sous-totaux par activité.',
      geste:
        'Reformuler la demande : quelle partie, quel total de référence, quelle période ?',
      consequence:
        'Sans cette reformulation, un calcul juste peut répondre à la mauvaise question.',
    },
  },
  {
    position: 2,
    screenId: 'B2-01-03-BASE',
    brique: 'fp-story',
    dureeMinutes: 7,
    concepts: ['proportion', 'pourcentage'],
    notes: 'Insister sur le dénominateur : il porte le sens.',
    proprietes: {
      titre: 'La base donne son sens au pourcentage',
      paragraphes: [
        'Une part se lit comme une relation entre une valeur étudiée et un total de référence.',
        'Avant de multiplier par 100, on écrit la phrase : « cette valeur représente quelle part de quoi ? »',
      ],
    },
  },
  {
    position: 3,
    screenId: 'B2-01-04-PARTIE-TOTAL',
    brique: 'fp-pro',
    dureeMinutes: 7,
    concepts: ['proportion'],
    notes: 'Relier partie, total et proportion dans les trois sens.',
    proprietes: {
      metier: 'Responsable d’activité',
      situation:
        'Le total mensuel est connu, mais une ligne de produit doit être comparée au portefeuille.',
      geste:
        'Séparer les trois objets : la partie observée, le total de référence et la relation entre les deux.',
      consequence:
        'Cette distinction évite de comparer des valeurs qui ne parlent pas du même périmètre.',
    },
  },
  {
    position: 4,
    screenId: 'B2-01-05-POURCENTAGE',
    brique: 'fp-story',
    dureeMinutes: 8,
    concepts: ['pourcentage'],
    notes: 'Faire verbaliser l’unité et l’ordre de grandeur.',
    proprietes: {
      titre: 'Un pourcentage est une relation, pas une unité',
      paragraphes: [
        '32 % signifie 32 pour 100 : la valeur compare une partie à sa base, elle ne remplace pas la valeur en euros ou en unités.',
        'Une présentation fiable donne toujours la valeur, le pourcentage et la phrase d’interprétation.',
      ],
    },
  },
  {
    position: 5,
    screenId: 'B2-01-06-EVOLUTION',
    brique: 'fp-pro',
    dureeMinutes: 8,
    concepts: ['taux-evolution'],
    notes: 'Distinguer écart absolu et taux d’évolution.',
    proprietes: {
      metier: 'Analyste commercial',
      situation:
        'Le chiffre d’affaires passe de 120 à 150 k€ entre deux périodes.',
      geste:
        'Comparer l’écart à la valeur de départ, puis annoncer clairement le sens de l’évolution.',
      consequence:
        'L’écart mesure des k€ ; le taux mesure une variation relative. Les deux réponses sont utiles mais ne répondent pas à la même demande.',
    },
  },
  {
    position: 6,
    screenId: 'B2-01-07-COEFFICIENT',
    brique: 'fp-story',
    dureeMinutes: 7,
    concepts: ['coefficient-multiplicateur'],
    notes: 'Installer le coefficient comme traduction opérationnelle du taux.',
    proprietes: {
      titre: 'Le coefficient rend l’évolution calculable',
      paragraphes: [
        'Une hausse de 12 % conserve 100 % de la valeur initiale et ajoute 12 % : le coefficient est 1,12.',
        'Pour une baisse, le coefficient reste positif et devient inférieur à 1. Cette écriture évite le raisonnement additif.',
      ],
    },
  },
  {
    position: 7,
    screenId: 'B2-01-08-CONTROLE',
    brique: 'fp-pro',
    dureeMinutes: 8,
    concepts: ['coefficient-multiplicateur', 'pourcentage'],
    notes: 'Terminer chaque calcul par un contrôle de cohérence.',
    proprietes: {
      metier: 'Révision comptable',
      situation:
        'Un tableau de bord affiche une variation et un montant final.',
      geste:
        'Contrôler le signe, l’unité, l’ordre de grandeur et la cohérence entre le taux et le coefficient.',
      consequence:
        'Un contrôle de trente secondes repère souvent une base inversée ou une virgule déplacée.',
    },
  },
  {
    position: 8,
    screenId: 'B2-01-09-EVOLUTIONS-SUCCESSIVES',
    brique: 'fp-story',
    dureeMinutes: 8,
    concepts: ['evolutions-successives'],
    notes: 'Montrer que les coefficients se multiplient.',
    proprietes: {
      titre: 'Deux évolutions se composent',
      paragraphes: [
        'Après une première évolution, la seconde s’applique à la nouvelle valeur : les taux ne s’additionnent pas mécaniquement.',
        'La lecture par coefficients permet de garder le fil, de calculer et d’expliquer le résultat sans faux raccourci.',
      ],
    },
  },
  {
    position: 9,
    screenId: 'B2-01-10-DECISION',
    brique: 'fp-pro',
    dureeMinutes: 8,
    concepts: ['taux-evolution'],
    notes: 'Revenir du calcul vers la décision.',
    proprietes: {
      metier: 'Comité de pilotage',
      situation:
        'Une évolution est calculée, mais le comité doit décider d’une action.',
      geste:
        'Présenter le résultat avec sa période, sa base, son unité et une interprétation prudente.',
      consequence:
        'La bonne communication ne masque ni le périmètre ni les limites de la donnée.',
    },
  },
  {
    position: 10,
    screenId: 'B2-01-11-CHECKLIST',
    brique: 'fp-story',
    dureeMinutes: 7,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes: 'Faire reprendre la checklist comme rituel de contrôle.',
    proprietes: {
      titre: 'La checklist avant de transmettre',
      paragraphes: [
        '1. Quelle est la question ? 2. Quelle est la base ? 3. Quelle unité ? 4. Quel ordre de grandeur ?',
        'Puis seulement : calculer, contrôler, écrire une phrase qui répond à la demande.',
      ],
    },
  },
  {
    position: 11,
    screenId: 'B2-01-12-SYNTHESE',
    brique: 'fp-pro',
    dureeMinutes: 8,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes: 'Clore par les trois réflexes à réutiliser en autonomie.',
    proprietes: {
      metier: 'Lecteur de données',
      situation:
        'Toute information chiffrée arrive avec un contexte, un périmètre et une décision à éclairer.',
      geste:
        'Identifier la relation, choisir le calcul adapté, puis vérifier avant de conclure.',
      consequence: 'Lire, contrôler et expliquer : c’est l’essentiel du B2-01.',
    },
  },
];

export class CreateFormationCourseContent1779100000000 implements MigrationInterface {
  name = 'CreateFormationCourseContent1779100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "formation_course_contents" ("id" uuid NOT NULL, "slug" character varying(120) NOT NULL, "titre" character varying(180) NOT NULL, "niveau" character varying(20) NOT NULL, "duree_minutes" integer NOT NULL, "concepts" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_formation_course_contents_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_formation_course_contents_slug" ON "formation_course_contents" ("slug")`,
    );
    await queryRunner.query(
      `CREATE TABLE "formation_screen_contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "position" integer NOT NULL, "screen_id" character varying(120) NOT NULL, "brique" character varying(40) NOT NULL, "duree_minutes" integer NOT NULL, "concepts" jsonb NOT NULL, "notes" text NOT NULL DEFAULT '', "proprietes" jsonb NOT NULL, CONSTRAINT "PK_formation_screen_contents_id" PRIMARY KEY ("id"), CONSTRAINT "FK_formation_screen_contents_course" FOREIGN KEY ("course_id") REFERENCES "formation_course_contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_formation_screen_contents_course_position" ON "formation_screen_contents" ("course_id", "position")`,
    );

    await queryRunner.query(
      `INSERT INTO "formation_course_contents" ("id", "slug", "titre", "niveau", "duree_minutes", "concepts") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        COURSE_ID,
        SLUG,
        "Lire et contrôler l'information chiffrée",
        'B2',
        90,
        JSON.stringify([
          'proportion',
          'pourcentage',
          'taux-evolution',
          'coefficient-multiplicateur',
          'evolutions-successives',
        ]),
      ],
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
      `DROP INDEX "uq_formation_screen_contents_course_position"`,
    );
    await queryRunner.query(`DROP TABLE "formation_screen_contents"`);
    await queryRunner.query(`DROP INDEX "IDX_formation_course_contents_slug"`);
    await queryRunner.query(`DROP TABLE "formation_course_contents"`);
  }
}
