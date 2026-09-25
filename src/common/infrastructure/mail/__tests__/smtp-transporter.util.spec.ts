/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { generateKeyPairSync } from 'node:crypto';
import { setSmtpEnv } from '../../../../../test/factories/mailer.factory';

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

const VALID_KEY = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
}).privateKey;

function enableDkim(overrides: Record<string, string> = {}): void {
  process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';
  process.env.SMTP_DKIM_SELECTOR = 'default';
  process.env.SMTP_DKIM_PRIVATE_KEY = VALID_KEY;
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

describe('createOptionalSmtpTransporter', () => {
  let logger: Logger;
  let cleanup: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup = setSmtpEnv();
    clearEnvRestorableBySetSmtpEnv();
    logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  });

  afterEach(() => {
    cleanup();
  });

  function clearEnvRestorableBySetSmtpEnv(): void {
    const restorable = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_SECURE',
      'SMTP_FROM',
      'SMTP_DKIM_DOMAIN',
      'SMTP_DKIM_SELECTOR',
      'SMTP_DKIM_PRIVATE_KEY',
    ];
    for (const key of restorable) delete process.env[key];
  }

  function configureSmtp(): void {
    process.env.SMTP_HOST = 'smtp.example.org';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'mailer';
    process.env.SMTP_PASS = 'secret'; // gitleaks:allow — scan de secrets, ci.yml
  }

  function lastOptions(): TransportOptions {
    return mockCreateTransport.mock.calls[0][0] as TransportOptions;
  }

  function dkimRetenu(
    overrides: Record<string, string> = {},
  ): TransportOptions['dkim'] {
    configureSmtp();
    enableDkim(overrides);
    createOptionalSmtpTransporter(logger, 'Test');
    return lastOptions().dkim;
  }

  function enTetesSignes(): string[] {
    return (dkimRetenu()?.headerFieldNames ?? '').split(':');
  }

  function attendreSignatureRefusee(dkim: TransportOptions['dkim']): void {
    expect(dkim).toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
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

      expect(lastOptions().dkim).toBeUndefined();
    });

    it('signe avec la cle fournie quand les trois variables sont presentes', () => {
      const dkim = dkimRetenu();

      expect(dkim?.domainName).toBe('asilidesign.fr');
      expect(dkim?.keySelector).toBe('default');
      expect(dkim?.privateKey).toBe(VALID_KEY);
    });

    it('couvre List-Unsubscribe et List-Unsubscribe-Post par la signature', () => {
      // La RFC 8058 §4 impose que ces deux en-tetes figurent dans le tag
      // `h=` de la signature, faute de quoi Gmail ignore le bouton natif
      // de desabonnement.
      //
      // L'assertion porte sur la liste eclatee, jamais sur la chaine :
      // `toContain('List-Unsubscribe')` sur une chaine est satisfait par
      // la seule presence de `List-Unsubscribe-Post`, ce qui laisserait
      // passer le retrait de l'en-tete central.
      const names = enTetesSignes();
      expect(names).toContain('List-Unsubscribe');
      expect(names).toContain('List-Unsubscribe-Post');
      expect(names).toContain('From');
      expect(names).toContain('Subject');
    });

    it('conserve la couverture par defaut de nodemailer (RFC 4871 §5.5)', () => {
      const names = enTetesSignes();
      for (const field of [
        'Cc',
        'Content-Transfer-Encoding',
        'In-Reply-To',
        'References',
        'List-Id',
      ]) {
        expect(names).toContain(field);
      }
    });

    it('desactive la signature si la cle privee est inexploitable', () => {
      const dkim = dkimRetenu({ SMTP_DKIM_PRIVATE_KEY: 'pas-une-cle-pem' });

      // nodemailer avale l'exception de signature et envoie le message
      // SANS en-tete DKIM : sans ce controle, le deploiement se croirait
      // conforme RFC 8058 sans que rien ne le signale.
      attendreSignatureRefusee(dkim);
    });

    it('accepte une cle RSA au format PKCS#1', () => {
      // `openssl genrsa` et `opendkim-genkey` produisent du PKCS#1
      // (RFC 8017), quand le cas nominal ci-dessus genere du PKCS#8
      // (RFC 5208).
      const pkcs1 = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      }).privateKey;
      expect(dkimRetenu({ SMTP_DKIM_PRIVATE_KEY: pkcs1 })?.privateKey).toBe(
        pkcs1,
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('refuse une cle qui n’est pas RSA', () => {
      // La RFC 6376 ne definit que `rsa-sha256`. Une cle EC passerait la
      // validation PEM mais produirait une signature ECDSA qu'aucun
      // verificateur DKIM n'accepte — echec silencieux a nouveau.
      const ecKey = generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      }).privateKey;
      attendreSignatureRefusee(dkimRetenu({ SMTP_DKIM_PRIVATE_KEY: ecKey }));
    });

    it('retablit une cle PEM collee avec des \\n litteraux', () => {
      // Les `env_file` de compose.yaml ne portent pas de valeur multiligne.
      const dkim = dkimRetenu({
        SMTP_DKIM_PRIVATE_KEY: VALID_KEY.replace(/\n/g, '\\n'),
      });

      expect(dkim?.privateKey).toBe(VALID_KEY);
    });

    it.each([
      ['un domaine avec saut de ligne', { SMTP_DKIM_DOMAIN: 'a.fr\nBcc: x@y' }],
      [
        'un selecteur avec saut de ligne',
        { SMTP_DKIM_SELECTOR: 'sel\nBcc: x' },
      ],
      ['un domaine vide de sens', { SMTP_DKIM_DOMAIN: 'pas un domaine' }],
    ])('refuse %s', (_label, overrides) => {
      // Concatenees telles quelles dans l'en-tete `DKIM-Signature`
      // (RFC 6376 section 3.5), ces valeurs y injecteraient un en-tete
      // arbitraire des qu'elles portent un saut de ligne.
      attendreSignatureRefusee(dkimRetenu(overrides));
    });

    it('ignore une configuration DKIM partielle et le signale', () => {
      configureSmtp();
      process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';

      createOptionalSmtpTransporter(logger, 'Test');

      attendreSignatureRefusee(lastOptions().dkim);
    });
  });
});
