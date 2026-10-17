import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  Controller,
  Get,
  type DynamicModule,
  type ForwardReference,
} from '@nestjs/common';
import {
  CONTROLLER_WATERMARK,
  MODULE_METADATA,
} from '@nestjs/common/constants';
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

async function controleursAtteintsDepuis(
  racines: readonly unknown[],
): Promise<Controleur[]> {
  const vus = new Set<unknown>();
  const servis = new Set<Controleur>();
  const parcourir = async (importe: unknown): Promise<void> => {
    const module: unknown = await importe;
    if (module === null || vus.has(module)) return;
    vus.add(module);
    if (typeof module === 'function') {
      metadonneeDeModule(MODULE_METADATA.CONTROLLERS, module).forEach(
        (controleur) => servis.add(controleur as Controleur),
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
    (dynamique.controllers ?? []).forEach((controleur) =>
      servis.add(controleur as Controleur),
    );
    for (const suivant of [dynamique.module, ...(dynamique.imports ?? [])])
      await parcourir(suivant);
  };
  for (const racine of racines) await parcourir(racine);
  return [...servis];
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
