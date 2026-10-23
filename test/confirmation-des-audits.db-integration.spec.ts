import {
  AuditRequest,
  HEURES_DE_VALIDITE_D_UNE_CONFIRMATION,
} from '../src/modules/audit-requests/domain/AuditRequest';
import { AuditRequestsRepositoryTypeORM } from '../src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestEntity } from '../src/modules/audit-requests/infrastructure/entities/AuditRequest.entity';
import { emettreJeton } from '../src/common/domain/crypto/TokenHash';
import { buildAuditRequest } from './factories/audit-requests.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

describeDb('Confirmation d une demande d audit sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
  );

  const depot = () =>
    new AuditRequestsRepositoryTypeORM(
      base().getRepository(AuditRequestEntity),
    );

  const demandeEnAttente = async () => {
    const jeton = emettreJeton();
    const creee = await depot().create(
      AuditRequest.create(buildAuditRequest()),
      jeton.empreinte,
    );
    return { ...creee, empreinte: jeton.empreinte };
  };

  const ligne = async (auditId: string) => {
    const [trouvee]: {
      processingStatus: string;
      confirmation_hash: string | null;
      confirmee_le: Date | null;
    }[] = await base().query(
      `SELECT "processingStatus", confirmation_hash, confirmee_le FROM audit_requests WHERE id = $1`,
      [auditId],
    );
    return trouvee;
  };

  it('garde une demande par courriel hors de la file tant qu elle n est pas confirmee', async () => {
    const { auditId, status, heuresDeValiditeDeLaConfirmation } =
      await demandeEnAttente();

    expect(status).toBe('UNCONFIRMED');
    expect(heuresDeValiditeDeLaConfirmation).toBe(
      HEURES_DE_VALIDITE_D_UNE_CONFIRMATION,
    );
    await expect(ligne(auditId)).resolves.toMatchObject({
      processingStatus: 'UNCONFIRMED',
      confirmee_le: null,
    });
  });

  it('ne promet aucun delai de confirmation a une demande sans lien a confirmer', async () => {
    await expect(
      depot().create(AuditRequest.create(buildAuditRequest()), null),
    ).resolves.toMatchObject({
      status: 'PENDING',
      heuresDeValiditeDeLaConfirmation: null,
    });
  });

  it('confirme une seule fois : la demande passe en file, l empreinte s efface et la confirmation est datee', async () => {
    const { auditId, empreinte } = await demandeEnAttente();

    await expect(depot().confirmer(empreinte)).resolves.toBe(auditId);
    await expect(depot().confirmer(empreinte)).resolves.toBeNull();

    const confirmee = await ligne(auditId);
    expect(confirmee.processingStatus).toBe('PENDING');
    expect(confirmee.confirmation_hash).toBeNull();
    expect(confirmee.confirmee_le).toBeInstanceOf(Date);
  });

  it('refuse un lien plus vieux que sa validite, sur l horloge de la base', async () => {
    const { auditId, empreinte } = await demandeEnAttente();
    await base().query(
      `UPDATE audit_requests SET created_at = LOCALTIMESTAMP - make_interval(hours => $2) WHERE id = $1`,
      [auditId, HEURES_DE_VALIDITE_D_UNE_CONFIRMATION + 1],
    );

    await expect(depot().confirmer(empreinte)).resolves.toBeNull();
    await expect(ligne(auditId)).resolves.toMatchObject({
      processingStatus: 'UNCONFIRMED',
    });
  });

  it('refuse une empreinte inconnue', async () => {
    await demandeEnAttente();

    await expect(
      depot().confirmer(emettreJeton().empreinte),
    ).resolves.toBeNull();
  });
});
