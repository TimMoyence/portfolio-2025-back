import {
  type GestionnaireSimule,
  mockTypeOrmManager,
  mockTypeOrmRepositoryAvecManager,
} from '../../../../test/factories/formation-entities.factory';
import type { VerrouParBoite } from '../../domain/verrou-par-boite';
import { AuditRequestsRepositoryTypeORM } from '../../../modules/audit-requests/infrastructure/AuditRequests.repository.typeORM';
import { LeadMagnetRequestRepositoryTypeORM } from '../../../modules/lead-magnets/infrastructure/LeadMagnetRequest.repository.typeorm';
import { NewsletterSubscriberRepositoryTypeORM } from '../../../modules/newsletter/infrastructure/NewsletterSubscriber.repository.typeorm';

const VERROU = 'SELECT pg_advisory_xact_lock(hashtext($1))';

const DEPOTS_DE_FORMULAIRE: readonly [
  string,
  (manager: GestionnaireSimule) => VerrouParBoite<unknown>,
][] = [
  [
    'des demandes d audit',
    (manager) =>
      new AuditRequestsRepositoryTypeORM(
        mockTypeOrmRepositoryAvecManager({}, manager),
      ),
  ],
  [
    'des demandes de boite a outils',
    (manager) =>
      new LeadMagnetRequestRepositoryTypeORM(
        mockTypeOrmRepositoryAvecManager({}, manager),
      ),
  ],
  [
    'des abonnes a la newsletter',
    (manager) =>
      new NewsletterSubscriberRepositoryTypeORM(
        mockTypeOrmRepositoryAvecManager({}, manager),
      ),
  ],
];

describe('Verrou par boite des depots de formulaire', () => {
  it.each(DEPOTS_DE_FORMULAIRE)(
    'le depot %s verrouille la boite de livraison, pas l adresse saisie',
    async (_depot, depotSur) => {
      const query = jest.fn().mockResolvedValue([]);
      const manager = mockTypeOrmManager({
        query,
        withRepository: jest.fn((repo: unknown) => repo),
      });

      await depotSur(manager).sousVerrouDeLaBoite(
        'L.ea+relance@googlemail.com',
        () => Promise.resolve(),
      );

      expect(query).toHaveBeenCalledWith(VERROU, [
        'table_simulee:lea@gmail.com',
      ]);
    },
  );
});
