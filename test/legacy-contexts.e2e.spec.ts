import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ProjectListQueryDto } from '../src/modules/projects/interfaces/dto/project-list.query.dto';
import { RedirectListQueryDto } from '../src/modules/redirects/interfaces/dto/redirect-list.query.dto';
import { ServiceListQueryDto } from '../src/modules/services/interfaces/dto/service-list.query.dto';
import { ServiceRequestDto } from '../src/modules/services/interfaces/dto/service.request.dto';
import {
  attendreCreationTransmise,
  attendreFiltreTransmis,
  attendreListeParDefaut,
  CAS_LEGACY,
  CAS_LEGACY_FILTRABLES,
  type ContexteLegacy,
  type ControleurLegacy,
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  legacyControllerProviders,
  legacyListBody,
  primeLegacyUseCaseStubs,
} from './factories/legacy-contract.factory';
import { validateBody, validateQuery } from './helpers/validation-pipe';

describe('Legacy contexts connectivity (e2e transportless)', () => {
  const stubs = createLegacyUseCaseStubs();
  let moduleRef: TestingModule;

  const controleurDe = (contexte: ContexteLegacy) =>
    moduleRef.get<ControleurLegacy>(contexte.controleur);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: LEGACY_CONTROLLERS,
      providers: legacyControllerProviders(stubs),
    }).compile();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    primeLegacyUseCaseStubs(stubs);
  });

  it.each(CAS_LEGACY)(
    'exposes paginated GET responses on legacy %s controller',
    async (_route, contexte) => {
      const query = await validateQuery({}, contexte.listQueryDto);

      await expect(controleurDe(contexte).findAll(query)).resolves.toEqual(
        legacyListBody(contexte.entite),
      );
      attendreListeParDefaut(contexte, stubs);
    },
  );

  it.each(CAS_LEGACY_FILTRABLES)(
    'forwards optional legacy GET filters to %s list use case',
    async (_route, contexte) => {
      const query = await validateQuery(
        contexte.filtre?.parametres,
        contexte.listQueryDto,
      );

      await controleurDe(contexte).findAll(query);

      attendreFiltreTransmis(contexte, stubs);
    },
  );

  it.each(CAS_LEGACY)(
    'connects POST %s to use case with validated command payload',
    async (_route, contexte) => {
      const payload = await validateBody(contexte.payload, contexte.requestDto);

      const result = await controleurDe(contexte).create(payload);

      attendreCreationTransmise(contexte, stubs, result);
    },
  );

  it('rejects non-whitelisted fields on legacy DTOs', async () => {
    await expect(
      validateBody(
        {
          slug: 'technical-seo',
          name: 'Technical SEO',
          injected: 'forbidden',
        },
        ServiceRequestDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid sort field on legacy list query', async () => {
    await expect(
      validateQuery({ sortBy: 'invalid' }, ServiceListQueryDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each<[Record<string, string>, new () => object]>([
    [{ status: 'INVALID' }, ServiceListQueryDto],
    [{ type: 'INVALID' }, ProjectListQueryDto],
    [{ enabled: 'INVALID' }, RedirectListQueryDto],
  ])('rejects invalid legacy filter values (%o)', async (query, dto) => {
    await expect(validateQuery(query, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
