import type { DataSource } from 'typeorm';
import type { Provenance } from '../../src/common/domain/provenance';
import { AuditRequest } from '../../src/modules/audit-requests/domain/AuditRequest';
import { AuditRequestsRepositoryTypeORM } from '../../src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestEntity } from '../../src/modules/audit-requests/infrastructure/entities/AuditRequest.entity';
import { Contacts } from '../../src/modules/contacts/domain/Contacts';
import { ContactsRepositoryTypeORM } from '../../src/modules/contacts/infrastructure/Contacts.repository.typeORM';
import { ContactMessagesEntity } from '../../src/modules/contacts/infrastructure/entities/ContactMessage.entity';
import { buildAuditRequest } from '../factories/audit-requests.factory';
import { buildContact } from '../factories/contacts.factory';

export const DEPOTS_DE_PROVENANCE = {
  contacts: (base: DataSource, provenance: Provenance) =>
    new ContactsRepositoryTypeORM(
      base.getRepository(ContactMessagesEntity),
    ).create(Contacts.create(buildContact(provenance))),
  audit_requests: (base: DataSource, provenance: Provenance) =>
    new AuditRequestsRepositoryTypeORM(
      base.getRepository(AuditRequestEntity),
    ).create(AuditRequest.create(buildAuditRequest(provenance)), null),
};

export type TableDeProvenance = keyof typeof DEPOTS_DE_PROVENANCE;

export const TABLES_DE_PROVENANCE = Object.keys(
  DEPOTS_DE_PROVENANCE,
) as TableDeProvenance[];
