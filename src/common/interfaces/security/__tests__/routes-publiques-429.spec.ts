import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Optional,
  UseGuards,
  type DynamicModule,
  type ForwardReference,
} from '@nestjs/common';
import {
  CONTROLLER_WATERMARK,
  EXCEPTION_FILTERS_METADATA,
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  MODULE_METADATA,
  OPTIONAL_DEPS_METADATA,
  PARAMTYPES_METADATA,
  PIPES_METADATA,
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

const DEPENDANCES_HERITEES: Readonly<Record<string, string>> = {
  [SELF_DECLARED_DEPS_METADATA]: 'paramètre',
  [OPTIONAL_DEPS_METADATA]: 'paramètre facultatif',
};

const ENHANCERS = [
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  PIPES_METADATA,
  EXCEPTION_FILTERS_METADATA,
];

const CONSTRUCTEUR_DECLARE = /[{};]\s*constructor\s*\(/;

const rangsDeclares = (dependances: unknown): number[] =>
  ((dependances ?? []) as (number | { index: number })[]).map((dependance) =>
    typeof dependance === 'number' ? dependance : dependance.index,
  );

const mereDe = (classe: Classe): object =>
  Object.getPrototypeOf(classe) as object;

const rangsHerites = (classe: Classe, cle: string): number[] =>
  rangsDeclares(Reflect.getMetadata(cle, mereDe(classe)));

const constructeurSansMetadonnees = (classe: Classe): boolean =>
  !Reflect.hasOwnMetadata(PARAMTYPES_METADATA, classe) &&
  Reflect.hasMetadata(PARAMTYPES_METADATA, mereDe(classe)) &&
  CONSTRUCTEUR_DECLARE.test(Function.prototype.toString.call(classe));

function defautsDInjection(classe: Classe, nom = classe.name): string[] {
  if (constructeurSansMetadonnees(classe))
    return [`${nom} : constructeur sans métadonnées propres`];
  if (!Reflect.hasOwnMetadata(PARAMTYPES_METADATA, classe))
    return Reflect.hasMetadata(PARAMTYPES_METADATA, mereDe(classe))
      ? defautsDInjection(mereDe(classe) as Classe, nom)
      : [];
  return Object.entries(DEPENDANCES_HERITEES).flatMap(([cle, libelle]) => {
    const herites = rangsHerites(classe, cle);
    const propres = rangsDeclares(Reflect.getOwnMetadata(cle, classe)).slice(
      herites.length,
    );
    return [...new Set(herites)]
      .filter((rang) => !propres.includes(rang))
      .map((rang) => `${nom} : ${libelle} ${rang}`);
  });
}

const providersMalInjectes = (classes: readonly Classe[]): string[] =>
  classes.flatMap((classe) => defautsDInjection(classe));

const enhancersDe = (cible: object): unknown[] =>
  ENHANCERS.flatMap(
    (cle) => (Reflect.getMetadata(cle, cible) as unknown[] | undefined) ?? [],
  );

async function classesConstruitesDepuis(
  racines: readonly unknown[],
): Promise<Classe[]> {
  const providers = await declaresDepuis(
    MODULE_METADATA.PROVIDERS as Rubrique,
    racines,
  );
  const controleurs = await controleursAtteintsDepuis(racines);
  const enhancers = [
    ...controleurs.flatMap(enhancersDe),
    ...routesDe(controleurs).flatMap(({ cibles }) =>
      cibles.flatMap(enhancersDe),
    ),
  ];
  return [
    ...new Set(
      [...providers, ...controleurs, ...enhancers]
        .map(classeDuProvider)
        .filter((classe): classe is Classe => classe !== null),
    ),
  ];
}

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

  class FilleNonDecoree extends Mere {
    constructor(depot: object, journal: object, outil: Outil) {
      super(depot, outil, journal);
    }
  }

  class Introuvable {}

  @Injectable()
  abstract class MereFacultative {
    constructor(
      readonly outil: Outil,
      @Optional() readonly absent?: Introuvable,
    ) {}
  }

  @Injectable()
  class FilleFacultative extends MereFacultative {
    constructor(
      outil: Outil,
      readonly requis: Introuvable,
    ) {
      super(outil);
    }
  }

  @Injectable()
  class GardeQuiReordonne extends FilleQuiReordonne {
    canActivate(): boolean {
      return true;
    }
  }

  @Controller('temoin-injection')
  @UseGuards(GardeQuiReordonne)
  class ControleurQuiReordonne extends FilleQuiReordonne {
    @Get()
    lire(): string {
      return 'temoin';
    }
  }

  const depot = { nom: 'depot' };
  const journal = { nom: 'journal' };
  const DEPENDANCES = [
    Outil,
    { provide: DEPOT, useValue: depot },
    { provide: JOURNAL, useValue: journal },
  ];

  @Module({
    controllers: [ControleurQuiReordonne],
    providers: [...DEPENDANCES, FilleNonDecoree, FilleFacultative],
    exports: [Outil, DEPOT, JOURNAL],
  })
  class ModuleTemoin {}

  it('lit les injections héritées comme Nest les résout', async () => {
    const module = await Test.createTestingModule({
      imports: [ModuleTemoin],
      providers: [FilleQuiReordonne, FilleQuiReinjecte, FilleSansConstructeur],
    }).compile();

    expect(module.get(FilleQuiReordonne).outil).toBe(journal);
    expect(module.get(FilleNonDecoree).outil).toBe(journal);
    expect(module.get(ControleurQuiReordonne).outil).toBe(journal);
    expect(
      (await module.resolve(GardeQuiReordonne, undefined, { strict: false }))
        .outil,
    ).toBe(journal);
    expect(module.get(FilleFacultative).requis).toBeUndefined();
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

  it('juge chaque classe que construit Nest : providers, contrôleurs et leurs gardes', async () => {
    expect(
      providersMalInjectes(await classesConstruitesDepuis([ModuleTemoin])),
    ).toEqual([
      'FilleNonDecoree : constructeur sans métadonnées propres',
      'FilleFacultative : paramètre facultatif 1',
      'ControleurQuiReordonne : paramètre 2',
      'GardeQuiReordonne : paramètre 2',
    ]);
  });

  it('fait ré-injecter par chaque classe servie les rangs que sa classe mère injecte', async () => {
    const classes = await classesConstruitesDepuis([
      ...MODULES_SERVIS,
      ...MODULES_DES_SOURCES,
    ]);

    expect(
      classes.filter(
        (classe) =>
          rangsHerites(classe, SELF_DECLARED_DEPS_METADATA).length > 0,
      ).length,
    ).toBeGreaterThan(0);
    expect(providersMalInjectes(classes)).toEqual([]);
  });
});
