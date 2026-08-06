/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';

const mockCreateTransport = jest.fn().mockReturnValue({ sendMail: jest.fn() });

jest.mock('nodemailer', () => ({
  createTransport: (...args: unknown[]) => mockCreateTransport(...args),
}));

import { createOptionalSmtpTransporter } from '../smtp-transporter.util';

interface TransportOptions {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
    headerFieldNames?: string;
  };
}

const SMTP_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_SECURE',
  'SMTP_DKIM_DOMAIN',
  'SMTP_DKIM_SELECTOR',
  'SMTP_DKIM_PRIVATE_KEY',
] as const;

/** Cle de test factice, sans valeur cryptographique. */
const FAKE_KEY = '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----'; // gitleaks:allow

describe('createOptionalSmtpTransporter', () => {
  let logger: Logger;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    saved = {};
    for (const key of SMTP_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    logger = { warn: jest.fn() } as unknown as Logger;
  });

  afterEach(() => {
    for (const key of SMTP_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  function configureSmtp(): void {
    process.env.SMTP_HOST = 'smtp.example.org';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'mailer';
    process.env.SMTP_PASS = 'secret'; // gitleaks:allow
  }

  function lastOptions(): TransportOptions {
    return mockCreateTransport.mock.calls[0][0] as TransportOptions;
  }

  describe('configuration incomplete', () => {
    it('retourne null et loggue quand SMTP n’est pas configure', () => {
      const transporter = createOptionalSmtpTransporter(logger, 'Test mailer');

      expect(transporter).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it.each(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'])(
      'retourne null si %s manque',
      (missing) => {
        configureSmtp();
        delete process.env[missing];

        expect(createOptionalSmtpTransporter(logger, 'Test')).toBeNull();
      },
    );
  });

  describe('mode secure', () => {
    it('active TLS implicite sur le port 465', () => {
      configureSmtp();
      process.env.SMTP_PORT = '465';

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().secure).toBe(true);
    });

    it('reste en STARTTLS opportuniste sur le port 587', () => {
      configureSmtp();

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().secure).toBe(false);
    });

    it('force TLS quand SMTP_SECURE vaut true', () => {
      configureSmtp();
      process.env.SMTP_SECURE = 'true';

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().secure).toBe(true);
    });
  });

  describe('signature DKIM (RFC 8058 §4)', () => {
    it('n’active pas DKIM quand la configuration est absente', () => {
      configureSmtp();

      createOptionalSmtpTransporter(logger, 'Test');

      // Sans cle, nodemailer ne doit pas recevoir d'option `dkim` :
      // la signature reste a la charge du relais SMTP.
      expect(lastOptions().dkim).toBeUndefined();
    });

    it('signe avec la cle fournie quand les trois variables sont presentes', () => {
      configureSmtp();
      process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';
      process.env.SMTP_DKIM_SELECTOR = 'default';
      process.env.SMTP_DKIM_PRIVATE_KEY = FAKE_KEY;

      createOptionalSmtpTransporter(logger, 'Test');

      const { dkim } = lastOptions();
      expect(dkim?.domainName).toBe('asilidesign.fr');
      expect(dkim?.keySelector).toBe('default');
      expect(dkim?.privateKey).toBe(FAKE_KEY);
    });

    it('couvre List-Unsubscribe et List-Unsubscribe-Post par la signature', () => {
      configureSmtp();
      process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';
      process.env.SMTP_DKIM_SELECTOR = 'default';
      process.env.SMTP_DKIM_PRIVATE_KEY = FAKE_KEY;

      createOptionalSmtpTransporter(logger, 'Test');

      // La RFC 8058 §4 impose que ces deux en-tetes figurent dans le tag
      // `h=` de la signature, faute de quoi Gmail ignore le bouton natif
      // de desabonnement.
      const names = lastOptions().dkim?.headerFieldNames ?? '';
      expect(names).toContain('List-Unsubscribe');
      expect(names).toContain('List-Unsubscribe-Post');
      expect(names).toContain('From');
      expect(names).toContain('Subject');
    });

    it('ignore une configuration DKIM partielle et le signale', () => {
      configureSmtp();
      process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';
      // selecteur et cle manquants

      createOptionalSmtpTransporter(logger, 'Test');

      // Une signature partielle est impossible : mieux vaut ne pas
      // signer et le dire que d'echouer silencieusement a l'envoi.
      expect(lastOptions().dkim).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
