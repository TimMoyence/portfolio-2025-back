import {
  createMockTransporter,
  creationDeTransportSimulee,
  nodemailerSimule,
  setSmtpEnv,
} from '../../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => nodemailerSimule());

import {
  SmtpTransporterProvider,
  type SmtpTransporter,
} from './smtp-transporter.provider';

const mockedCreateTransport = creationDeTransportSimulee();

function resolveProvider(): SmtpTransporter {
  const factory = (
    SmtpTransporterProvider as { useFactory: () => SmtpTransporter }
  ).useFactory;
  return factory();
}

describe('SmtpTransporterProvider', () => {
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
  ])('%s', (_titre, variables) => {
    cleanupEnv = setSmtpEnv(variables);

    resolveProvider();

    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true }),
    );
  });

  it('retourne null et ne cree pas de transporter quand la config est incomplete', () => {
    cleanupEnv = setSmtpEnv({ SMTP_HOST: '' });

    const resolved = resolveProvider();

    expect(resolved).toBeNull();
    expect(mockedCreateTransport).not.toHaveBeenCalled();
  });
});
