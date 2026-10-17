import {
  createMockTransporter,
  creationDeTransportSimulee,
  nodemailerSimule,
  setSmtpEnv,
} from '../../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => nodemailerSimule());

import type { ExpediteurDeCourriels } from '../../../../common/infrastructure/mail/expediteur-smtp';
import { ExpediteurDAuditProvider } from './expediteur-d-audit.provider';

const mockedCreateTransport = creationDeTransportSimulee();

function resolveProvider(): ExpediteurDeCourriels {
  const factory = (
    ExpediteurDAuditProvider as { useFactory: () => ExpediteurDeCourriels }
  ).useFactory;
  return factory();
}

describe('ExpediteurDAuditProvider', () => {
  let cleanupEnv: () => void;

  beforeEach(() => {
    mockedCreateTransport.mockReturnValue(createMockTransporter() as never);
  });

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
    mockedCreateTransport.mockReset();
  });

  it.each([
    [
      'honore SMTP_SECURE=true meme sur un port non-465',
      { SMTP_PORT: '587', SMTP_SECURE: 'true' },
    ],
    [
      'active secure quand le port vaut 465 sans SMTP_SECURE (non-regression)',
      { SMTP_PORT: '465', SMTP_SECURE: '' },
    ],
    [
      'lit SMTP_SECURE sans tenir compte de la casse ni des blancs',
      { SMTP_PORT: '587', SMTP_SECURE: ' TRUE ' },
    ],
    [
      'garde secure sur le port 465 meme avec SMTP_SECURE=false',
      { SMTP_PORT: '465', SMTP_SECURE: 'false' },
    ],
  ])('%s', (_titre, variables) => {
    cleanupEnv = setSmtpEnv(variables);

    expect(resolveProvider().actif).toBe(true);
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true }),
    );
  });

  it('rend un expediteur inactif et ne cree pas de transporter quand la config est incomplete', () => {
    cleanupEnv = setSmtpEnv({ SMTP_HOST: '' });

    const resolved = resolveProvider();

    expect(resolved.actif).toBe(false);
    expect(mockedCreateTransport).not.toHaveBeenCalled();
  });
});
