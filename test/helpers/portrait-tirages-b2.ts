import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LireSujetUseCase } from '../../src/modules/formations/application/LireSujet.useCase';
import type { Bareme } from '../../src/modules/formations/domain/Bareme';
import type { Solution } from '../../src/modules/formations/domain/GradingCore';
import type { SessionRecord } from '../../src/modules/formations/domain/ISessions.repository';
import type { ContenuDeCoursBrut } from '../../src/modules/formations/domain/cours/CoursStocke';
import { lireCoursStocke } from '../../src/modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../src/modules/formations/domain/cours/DeroulePresentateur';
import { ouvrirTirages } from '../../src/modules/formations/domain/cours/OuvertureTirages';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import { serialiserCanonique } from '../../src/modules/formations/domain/cours/VecteursFormule';
import {
  creerCatalogueAVersions,
  tireurSequentiel,
} from '../factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../factories/formation.factory';

const DOSSIER_FIXTURES = join(__dirname, '../fixtures/formations');

const CHEMIN_CONTENUS_PUBLIES = join(
  DOSSIER_FIXTURES,
  'b2-01-v1-v2.contenus.json',
);

const CHEMIN_TIRAGES_DORES = join(
  DOSSIER_FIXTURES,
  'b2-01-v1-v2.tirages-dores.json',
);

export const GRAINES_DOREES = [
  0, 1, 2, 17, 42, 1000, 4242, 65535, 123456789, 2147483646,
] as const;

const PREMIERE_GRAINE_DU_TIREUR = 1000;

type EtatDeSeance = Pick<
  SessionRecord,
  'etat' | 'modeRythme' | 'ecranCourant' | 'intervalleLibre'
>;

const SEANCES_DOREES: readonly EtatDeSeance[] = [
  {
    etat: 'attente',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
  },
  {
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 30,
    intervalleLibre: null,
  },
  {
    etat: 'en_cours',
    modeRythme: 'libre',
    ecranCourant: 12,
    intervalleLibre: { premier: 10, dernier: 40 },
  },
  {
    etat: 'terminee',
    modeRythme: 'pilote',
    ecranCourant: 71,
    intervalleLibre: null,
  },
];

interface EcranPortrait {
  readonly id: string;
  readonly type: string;
  readonly duree: number;
  readonly interactif: boolean;
  readonly donnees: string;
}

interface EcranDeroulePortrait extends EcranPortrait {
  readonly notes: string;
  readonly seuil: number | null;
  readonly corriges: unknown;
  readonly guide: string | null;
}

interface PortraitDuTirage {
  readonly entete: unknown;
  readonly sujet: readonly EcranPortrait[];
  readonly solutions: Readonly<Record<string, Solution>>;
  readonly libellesOptions: unknown;
  readonly corriges: unknown;
  readonly deroule: {
    readonly remediations: unknown;
    readonly ecrans: readonly EcranDeroulePortrait[];
  };
  readonly lireSujet: readonly (readonly EcranPortrait[])[];
}

interface PortraitDuBareme {
  readonly premiereGraine: number;
  readonly graineReference: number;
  readonly questions: Bareme['questions'];
  readonly graines: readonly number[];
}

export interface PortraitDore {
  readonly version: number;
  readonly bareme: PortraitDuBareme;
  readonly tirage: PortraitDuTirage;
}

export function empreinte(valeur: unknown): string {
  const sansIndefinis: unknown =
    valeur === undefined ? null : JSON.parse(JSON.stringify(valeur));
  return createHash('sha256')
    .update(serialiserCanonique(sansIndefinis), 'utf8')
    .digest('hex');
}

function lireJson<T>(chemin: string): T {
  return JSON.parse(readFileSync(chemin, 'utf8')) as T;
}

export function contenusPublies(): readonly ContenuDeCoursBrut[] {
  return lireJson<ContenuDeCoursBrut[]>(CHEMIN_CONTENUS_PUBLIES);
}

export function portraitsDores(): readonly PortraitDore[] {
  return lireJson<PortraitDore[]>(CHEMIN_TIRAGES_DORES);
}

export function ecrirePortraitsDores(portraits: readonly PortraitDore[]): void {
  writeFileSync(
    CHEMIN_TIRAGES_DORES,
    `${JSON.stringify(portraits, null, 2)}\n`,
  );
}

interface EcranSorti {
  readonly id: string;
  readonly type: string;
  readonly duree: number;
  readonly interactif: boolean;
  readonly donnees: unknown;
}

function ecranPortrait(ecran: EcranSorti): EcranPortrait {
  return {
    id: ecran.id,
    type: ecran.type,
    duree: ecran.duree,
    interactif: ecran.interactif,
    donnees: empreinte(ecran.donnees),
  };
}

export function baremeFige(
  bareme: PortraitDuBareme,
  solutions: Readonly<Record<string, Solution>>,
): Bareme {
  return {
    version: 1,
    graineReference: bareme.graineReference,
    questions: bareme.questions,
    tirages: GRAINES_DOREES.map((seed) => ({ seed, solutions })),
  };
}

export function portraitDuBareme(
  contenu: ContenuDeCoursBrut,
): PortraitDuBareme {
  const bareme = ouvrirTirages(
    lireCoursStocke(contenu),
    tireurSequentiel(PREMIERE_GRAINE_DU_TIREUR),
  );
  return {
    premiereGraine: PREMIERE_GRAINE_DU_TIREUR,
    graineReference: bareme.graineReference,
    questions: bareme.questions,
    graines: bareme.tirages.map((tirage) => tirage.seed),
  };
}

export function solutionsDuBareme(
  contenu: ContenuDeCoursBrut,
): readonly Readonly<Record<string, Solution>>[] {
  return ouvrirTirages(
    lireCoursStocke(contenu),
    tireurSequentiel(PREMIERE_GRAINE_DU_TIREUR),
  ).tirages.map((tirage) => tirage.solutions);
}

async function sujetsServis(
  contenu: ContenuDeCoursBrut,
  bareme: Bareme,
  graine: number,
): Promise<readonly (readonly EcranPortrait[])[]> {
  const catalogue = creerCatalogueAVersions({
    [contenu.slug]: { [contenu.version]: lireCoursStocke(contenu) },
  });
  const portraits: (readonly EcranPortrait[])[] = [];
  for (const etat of SEANCES_DOREES) {
    const sessions = createMockSessionsRepo();
    const participants = createMockParticipantsRepo();
    const session = buildSessionRecord({
      courseSlug: contenu.slug,
      courseVersion: contenu.version,
      bareme,
      ...etat,
    });
    sessions.findById.mockResolvedValue(session);
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ sessionId: session.id, seed: graine }),
    );
    const sujet = await new LireSujetUseCase(
      sessions,
      participants,
      catalogue,
    ).execute({ sessionId: session.id, participantId: 'participant-dore' });
    portraits.push(sujet.ecrans.map(ecranPortrait));
  }
  return portraits;
}

export async function portraitDuTirage(
  contenu: ContenuDeCoursBrut,
  bareme: Bareme,
  graine: number,
): Promise<PortraitDuTirage> {
  const cours = lireCoursStocke(contenu);
  const tirage = tirer(cours, graine);
  const deroule = deroulePresentateur(cours, graine);
  return {
    entete: { ...tirage.sujet, ecrans: tirage.sujet.ecrans.length },
    sujet: tirage.sujet.ecrans.map(ecranPortrait),
    solutions: tirage.solutions,
    libellesOptions: tirage.libellesOptions,
    corriges: tirage.corriges,
    deroule: {
      remediations: deroule.remediations,
      ecrans: deroule.ecrans.map((ecran) => ({
        ...ecranPortrait(ecran),
        notes: empreinte(ecran.notes),
        seuil: ecran.seuil,
        corriges: ecran.corriges,
        guide: ecran.guide === undefined ? null : empreinte(ecran.guide),
      })),
    },
    lireSujet: await sujetsServis(contenu, bareme, graine),
  };
}

export async function portraitCourant(
  contenu: ContenuDeCoursBrut,
): Promise<PortraitDore> {
  const [graine] = GRAINES_DOREES;
  const bareme = portraitDuBareme(contenu);
  const solutions = tirer(lireCoursStocke(contenu), graine).solutions;
  return {
    version: contenu.version,
    bareme,
    tirage: await portraitDuTirage(
      contenu,
      baremeFige(bareme, solutions),
      graine,
    ),
  };
}
