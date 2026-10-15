import type { DataSource } from 'typeorm';
import type { Provenance } from '../src/common/domain/provenance';
import { AuditRequest } from '../src/modules/audit-requests/domain/AuditRequest';
import { AuditRequestsRepositoryTypeORM } from '../src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestEntity } from '../src/modules/audit-requests/infrastructure/entities/AuditRequest.entity';
import { Contacts } from '../src/modules/contacts/domain/Contacts';
import { ContactsRepositoryTypeORM } from '../src/modules/contacts/infrastructure/Contacts.repository.typeORM';
import { ContactMessagesEntity } from '../src/modules/contacts/infrastructure/entities/ContactMessage.entity';
import { CookieConsent } from '../src/modules/cookie-consents/domain/CookieConsent';
import { CookieConsentsRepositoryTypeORM } from '../src/modules/cookie-consents/infrastructure/CookieConsents.repository.typeORM';
import { CookieConsentEntity } from '../src/modules/cookie-consents/infrastructure/entities/CookieConsent.entity';
import { buildAuditRequest } from './factories/audit-requests.factory';
import { buildContact } from './factories/contacts.factory';
import { buildChoixDeConsentement } from './factories/cookie-consents.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';
import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from './helpers/provenance';

const DEPOTS = {
  contacts: (base: DataSource, provenance: Provenance) =>
    new ContactsRepositoryTypeORM(
      base.getRepository(ContactMessagesEntity),
    ).create(Contacts.create(buildContact(provenance))),
  audit_requests: (base: DataSource, provenance: Provenance) =>
    new AuditRequestsRepositoryTypeORM(
      base.getRepository(AuditRequestEntity),
    ).create(AuditRequest.create(buildAuditRequest(provenance))),
  cookie_consents: (base: DataSource, provenance: Provenance) =>
    new CookieConsentsRepositoryTypeORM(
      base.getRepository(CookieConsentEntity),
    ).create(CookieConsent.create(buildChoixDeConsentement(provenance))),
};

type TableDeProvenance = keyof typeof DEPOTS;

const TABLES = Object.keys(DEPOTS) as TableDeProvenance[];

describeDb('Provenance des requetes consignee sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );

  const ligneConsignee = async (
    table: TableDeProvenance,
    provenance: Provenance,
  ) => {
    await base().query(`TRUNCATE "${table}" CASCADE`);
    await DEPOTS[table](base(), provenance);
    const lignes: Array<Required<Provenance> & { requestId: string }> =
      await base().query(
        `SELECT host("ip") AS "ip", "userAgent", "referer", "requestId" FROM "${table}"`,
      );
    expect(lignes).toHaveLength(1);
    return lignes[0];
  };

  it.each(TABLES)(
    'consigne dans %s la provenance nettoyee et bornee',
    async (table) => {
      const ligne = await ligneConsignee(table, PROVENANCE_DEMESUREE);

      attendreUneProvenanceBornee(ligne);
      expect(ligne.requestId).toMatch(/^[0-9a-f-]{36}$/);
    },
  );

  it.each(TABLES)(
    'consigne dans %s une provenance absente comme nulle',
    async (table) => {
      expect(
        await ligneConsignee(table, {
          ip: null,
          userAgent: '   ',
          referer: undefined,
        }),
      ).toMatchObject({ ip: null, userAgent: null, referer: null });
    },
  );
});
