import { createTransport } from 'nodemailer';
import {
  SmtpTransporterProvider,
  type SmtpTransporter,
} from './smtp-transporter.provider';
import {
  createMockTransporter,
  setSmtpEnv,
} from '../../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockedCreateTransport = createTransport as jest.MockedFunction<
  typeof createTransport
>;

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

  it('honore SMTP_SECURE=true meme sur un port non-465', () => {
    cleanupEnv = setSmtpEnv({ SMTP_PORT: '587', SMTP_SECURE: 'true' });

    resolveProvider();

    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true }),
    );
  });

  it('active secure quand le port vaut 465 sans SMTP_SECURE (non-regression)', () => {
    cleanupEnv = setSmtpEnv({ SMTP_PORT: '465', SMTP_SECURE: '' });

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
