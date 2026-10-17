import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  Controller,
  Get,
  Inject,
  Injectable,
  type DynamicModule,
  type ForwardReference,
} from '@nestjs/common';
import {
  CONTROLLER_WATERMARK,
  MODULE_METADATA,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { AppModule } from '../../../../app.module';
import { IS_PUBLIC_KEY } from '../../auth/public.decorator';
import { routesDuControleur } from '../../../../../test/helpers/metadonnees-de-route';

jest.mock('../../../../config/env.validation', () => ({
  validateEnv: (configuration: Record<string, unknown>) => configuration,
}));

const RACINE_DES_SOURCES = join(__dirname, '..', '..', '..', '..');
const EXEMPTEE_DE_LIMITATION = 'THROTTLER:SKIPdefault';

interface Controleur {
  readonly name: string;
  readonly prototype: object;
}

const SOURCES = readdirSync(RACINE_DES_SOURCES, {
  recursive: true,
  encoding: 'utf8',
});

const exportsDe = (fichier: string): unknown[] =>
  Object.values(
    jest.requireActual<Record<string, unknown>>(
      join(RACINE_DES_SOURCES, fichier),
    ),
  );

const estControleur = (valeur: unknown): valeur is Controleur =>
  typeof valeur === 'function' &&
  Reflect.getMetadata(CONTROLLER_WATERMARK, valeur) === true;

const FICHIERS_DE_CONTROLEUR = SOURCES.filter((fichier) =>
  fichier.endsWith('.controller.ts'),
);

const CONTROLEURS_PAR_FICHIER = FICHIERS_DE_CONTROLEUR.map((fichier) => ({
  fichier,
  controleurs: exportsDe(fichier).filter(estControleur),
}));

const CONTROLEURS = CONTROLEURS_PAR_FICHIER.flatMap(
  ({ controleurs }) => controleurs,
);

const MODULES_SERVIS: unknown[] = [AppModule];

const MODULES_DES_SOURCES = SOURCES.filter((fichier) =>
  fichier.endsWith('.module.ts'),
).flatMap(exportsDe);

const metadonneeDeModule = (cle: string, module: unknown): unknown[] =>
  (Reflect.getMetadata(cle, module as object) as unknown[] | undefined) ?? [];

type Rubrique = 'controllers' | 'providers';

async function declaresDepuis(
  rubrique: Rubrique,
  racines: readonly unknown[],
): Promise<unknown[]> {
  const vus = new Set<unknown>();
  const declares = new Set<unknown>();
  const parcourir = async (importe: unknown): Promise<void> => {
    const module: unknown = await importe;
    if (module === null || vus.has(module)) return;
    vus.add(module);
    if (typeof module === 'function') {
      metadonneeDeModule(rubrique, module).forEach((declare) =>
        declares.add(declare),
      );
      for (const suivant of metadonneeDeModule(MODULE_METADATA.IMPORTS, module))
        await parcourir(suivant);
      return;
    }
    if (typeof module !== 'object') return;
    if ('forwardRef' in module) {
      await parcourir((module as ForwardReference).forwardRef());
      return;
    }
    const dynamique = module as Partial<DynamicModule>;
    (dynamique[rubrique] ?? []).forEach((declare) => declares.add(declare));
    for (const suivant of [dynamique.module, ...(dynamique.imports ?? [])])
      await parcourir(suivant);
  };
  for (const racine of racines) await parcourir(racine);
  return [...declares];
}

const controleursAtteintsDepuis = async (
  racines: readonly unknown[],
): Promise<Controleur[]> =>
  (await declaresDepuis(MODULE_METADATA.CONTROLLERS as Rubrique, racines)).map(
    (controleur) => controleur as Controleur,
  );

type Classe = abstract new (...parametres: never[]) => unknown;

const classeDuProvider = (provider: unknown): Classe | null => {
  if (typeof provider === 'function') return provider as Classe;
  const useClass = (provider as { useClass?: unknown } | null)?.useClass;
  return typeof useClass === 'function' ? (useClass as Classe) : null;
};

const rangsDeclares = (dependances: unknown): number[] =>
  ((dependances ?? []) as { index: number }[]).map(({ index }) => index);

const rangsHerites = (classe: Classe): number[] =>
  rangsDeclares(
    Reflect.getMetadata(
      SELF_DECLARED_DEPS_METADATA,
      Object.getPrototypeOf(classe) as object,
    ),
  );

function rangsHeritesSansInjection(classe: Classe): number[] {
  if (!Reflect.hasOwnMetadata(PARAMTYPES_METADATA, classe)) return [];
  const herites = rangsHerites(classe);
  const propres = rangsDeclares(
    Reflect.getOwnMetadata(SELF_DECLARED_DEPS_METADATA, classe),
  ).slice(herites.length);
  return [...new Set(herites)].filter((rang) => !propres.includes(rang));
}

const providersMalInjectes = (classes: readonly Classe[]): string[] =>
  classes.flatMap((classe) =>
    rangsHeritesSansInjection(classe).map(
      (rang) => `${classe.name} : paramètre ${rang}`,
    ),
  );

const routesDe = (controleurs: Iterable<Controleur>) =>
  [...controleurs].flatMap((controleur) =>
    routesDuControleur(controleur).map(({ action, gestionnaire }) => ({
      nom: `${controleur.name}.${action}`,
      cibles: [gestionnaire, controleur],
    })),
  );

type Route = ReturnType<typeof routesDe>[number];

const premiereDefinie = (cle: string, { cibles }: Route): unknown =>
  cibles
    .map((cible) => Reflect.getMetadata(cle, cible) as unknown)
    .find((valeur) => valeur !== undefined);

const estPublique = (route: Route) =>
  premiereDefinie(IS_PUBLIC_KEY, route) === true;

const estExemptee = (route: Route) =>
  premiereDefinie(EXEMPTEE_DE_LIMITATION, route) === true;

const declareSon429 = ({ cibles }: Route) =>
  cibles.some((cible) => {
    const reponses = Reflect.getMetadata(DECORATORS.API_RESPONSE, cible) as
      | Readonly<Record<string, unknown>>
      | undefined;
    return reponses?.['429'] !== undefined;
  });

const noms = (routes: readonly Route[]) => routes.map(({ nom }) => nom);

const absentsDe = (
  reference: readonly Controleur[],
  controleurs: readonly Controleur[],
) =>
  controleurs
    .filter((controleur) => !reference.includes(controleur))
    .map(({ name }) => name);

describe('Refus 429 des routes publiques', () => {
  let CONTROLEURS_SERVIS: Controleur[] = [];
  let CONTROLEURS_DECLARES: Controleur[] = [];
  let ROUTES: Route[] = [];

  beforeAll(async () => {
    CONTROLEURS_SERVIS = await controleursAtteintsDepuis(MODULES_SERVIS);
    CONTROLEURS_DECLARES = await controleursAtteintsDepuis([
      ...MODULES_SERVIS,
      ...MODULES_DES_SOURCES,
    ]);
    ROUTES = routesDe(new Set([...CONTROLEURS, ...CONTROLEURS_DECLARES]));
  });

  it('lit au moins un contrôleur exporté dans chaque fichier de contrôleur des sources', () => {
    expect(FICHIERS_DE_CONTROLEUR.length).toBeGreaterThan(0);
    expect(
      CONTROLEURS_PAR_FICHIER.filter(
        ({ controleurs }) => controleurs.length === 0,
      ).map(({ fichier }) => fichier),
    ).toEqual([]);
  });

  it('ne sert que des contrôleurs exportés par un fichier de contrôleur', () => {
    expect(CONTROLEURS_DECLARES.length).toBeGreaterThan(0);
    expect(absentsDe(CONTROLEURS, CONTROLEURS_DECLARES)).toEqual([]);
  });

  it('sert depuis AppModule chaque contrôleur exporté', () => {
    expect(absentsDe(CONTROLEURS_SERVIS, CONTROLEURS)).toEqual([]);
  });

  it('documente le 429 de chaque route publique que la garde globale peut limiter', () => {
    const limitees = ROUTES.filter(
      (route) => estPublique(route) && !estExemptee(route),
    );

    expect(limitees.length).toBeGreaterThan(0);
    expect(noms(limitees.filter((route) => !declareSon429(route)))).toEqual([]);
  });

  it('lit les routes qu un contrôleur hérite de sa classe de base, comme Nest les sert', () => {
    class LectureDeBase {
      @Get()
      lire(): string {
        return 'base';
      }

      @Get('masquee')
      masquee(): string {
        return 'base';
      }
    }

    @Controller('herite')
    class ControleurHerite extends LectureDeBase {
      override masquee(): string {
        return 'herite';
      }
    }

    expect(noms(routesDe([ControleurHerite]))).toEqual([
      'ControleurHerite.lire',
    ]);
  });

  it('ne promet aucun 429 sur une route exemptée de limitation', () => {
    expect(
      noms(
        ROUTES.filter((route) => estExemptee(route) && declareSon429(route)),
      ),
    ).toEqual([]);
  });
});

describe('Injection des providers qui héritent d un constructeur injecté', () => {
  const DEPOT = 'DEPOT';
  const JOURNAL = 'JOURNAL';

  @Injectable()
  class Outil {}

  @Injectable()
  abstract class Mere {
    constructor(
      @Inject(DEPOT) readonly depot: object,
      readonly outil: Outil,
      @Inject(JOURNAL) readonly journal: object,
    ) {}
  }

  @Injectable()
  class FilleQuiReordonne extends Mere {
    constructor(
      @Inject(DEPOT) depot: object,
      @Inject(JOURNAL) journal: object,
      outil: Outil,
    ) {
      super(depot, outil, journal);
    }
  }

  @Injectable()
  class FilleQuiReinjecte extends Mere {
    constructor(
      @Inject(DEPOT) depot: object,
      outil: Outil,
      @Inject(JOURNAL) journal: object,
      readonly suivant: Outil,
    ) {
      super(depot, outil, journal);
    }
  }

  @Injectable()
  class FilleSansConstructeur extends Mere {}

  it('lit les injections héritées comme Nest les résout', async () => {
    const depot = { nom: 'depot' };
    const journal = { nom: 'journal' };
    const module = await Test.createTestingModule({
      providers: [
        Outil,
        FilleQuiReordonne,
        FilleQuiReinjecte,
        FilleSansConstructeur,
        { provide: DEPOT, useValue: depot },
        { provide: JOURNAL, useValue: journal },
      ],
    }).compile();

    expect(module.get(FilleQuiReordonne).outil).toBe(journal);
    expect(module.get(FilleQuiReinjecte).outil).toBeInstanceOf(Outil);
    expect(module.get(FilleSansConstructeur).outil).toBeInstanceOf(Outil);
    expect(
      providersMalInjectes([
        FilleQuiReordonne,
        FilleQuiReinjecte,
        FilleSansConstructeur,
      ]),
    ).toEqual(['FilleQuiReordonne : paramètre 2']);
  });

  it('fait ré-injecter par chaque provider servi les rangs que sa classe mère injecte', async () => {
    const providers = await declaresDepuis(
      MODULE_METADATA.PROVIDERS as Rubrique,
      [...MODULES_SERVIS, ...MODULES_DES_SOURCES],
    );
    const classes = providers
      .map(classeDuProvider)
      .filter((classe): classe is Classe => classe !== null);

    expect(
      classes.filter((classe) => rangsHerites(classe).length > 0).length,
    ).toBeGreaterThan(0);
    expect(providersMalInjectes(classes)).toEqual([]);
  });
});
