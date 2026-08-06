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

/**
 * Cle RSA generee a la volee pour ce fichier de test : jamais commitee,
 * jamais reutilisee ailleurs, detruite a la fin du process. La signature
 * DKIM exige une cle reellement exploitable — une chaine factice serait
 * desormais rejetee par la validation, ce que ces tests verifient par
 * ailleurs.
 */
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
    // Factory partagee (`test/factories/mailer.factory.ts`) : elle pose
    // les variables SMTP et les restaure, DKIM compris. Dupliquer cette
    // mecanique ici contreviendrait a la regle DRY du projet.
    cleanup = setSmtpEnv();
    clearSmtpEnv();
    logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Repart d'un environnement vierge : chaque test pose ce qu'il teste.
   *
   * Seules les cles que `setSmtpEnv` sait restaurer sont retirees. Vider
   * tout `SMTP_*` laisserait `SMTP_REPLY_TO` — validee par le schema
   * d'environnement — non restauree apres le fichier.
   */
  function clearSmtpEnv(): void {
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
      enableDkim();

      createOptionalSmtpTransporter(logger, 'Test');

      const { dkim } = lastOptions();
      expect(dkim?.domainName).toBe('asilidesign.fr');
      expect(dkim?.keySelector).toBe('default');
      expect(dkim?.privateKey).toBe(VALID_KEY);
    });

    it('couvre List-Unsubscribe et List-Unsubscribe-Post par la signature', () => {
      configureSmtp();
      enableDkim();

      createOptionalSmtpTransporter(logger, 'Test');

      // La RFC 8058 §4 impose que ces deux en-tetes figurent dans le tag
      // `h=` de la signature, faute de quoi Gmail ignore le bouton natif
      // de desabonnement.
      //
      // L'assertion porte sur la liste eclatee, jamais sur la chaine :
      // `toContain('List-Unsubscribe')` sur une chaine est satisfait par
      // la seule presence de `List-Unsubscribe-Post`, ce qui laisserait
      // passer le retrait de l'en-tete central.
      const names = (lastOptions().dkim?.headerFieldNames ?? '').split(':');
      expect(names).toContain('List-Unsubscribe');
      expect(names).toContain('List-Unsubscribe-Post');
      expect(names).toContain('From');
      expect(names).toContain('Subject');
    });

    it('conserve la couverture par defaut de nodemailer (RFC 4871 §5.5)', () => {
      configureSmtp();
      enableDkim();

      createOptionalSmtpTransporter(logger, 'Test');

      // Restreindre la liste laisserait un relais ajouter un `Cc` ou
      // alterer l'encodage du corps sans invalider la signature.
      const names = (lastOptions().dkim?.headerFieldNames ?? '').split(':');
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
      configureSmtp();
      enableDkim({ SMTP_DKIM_PRIVATE_KEY: 'pas-une-cle-pem' });

      createOptionalSmtpTransporter(logger, 'Test');

      // nodemailer avale l'exception de signature et envoie le message
      // SANS en-tete DKIM : sans ce controle, le deploiement se croirait
      // conforme RFC 8058 sans que rien ne le signale.
      expect(lastOptions().dkim).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('accepte une cle RSA au format PKCS#1', () => {
      // `openssl genrsa` et `opendkim-genkey` produisent du PKCS#1,
      // quand le nominal ci-dessus genere du PKCS#8. Sans ce cas, un
      // durcissement futur (controle de l'en-tete PEM, par exemple)
      // casserait DKIM en production sans faire tomber un test.
      const pkcs1 = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      }).privateKey;
      configureSmtp();
      enableDkim({ SMTP_DKIM_PRIVATE_KEY: pkcs1 });

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().dkim?.privateKey).toBe(pkcs1);
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
      configureSmtp();
      enableDkim({ SMTP_DKIM_PRIVATE_KEY: ecKey });

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().dkim).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('retablit une cle PEM collee avec des \\n litteraux', () => {
      // Un `env_file` Docker ne supporte pas les valeurs multilignes.
      configureSmtp();
      enableDkim({
        SMTP_DKIM_PRIVATE_KEY: VALID_KEY.replace(/\n/g, '\\n'),
      });

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().dkim?.privateKey).toBe(VALID_KEY);
    });

    it.each([
      ['un domaine avec saut de ligne', { SMTP_DKIM_DOMAIN: 'a.fr\nBcc: x@y' }],
      [
        'un selecteur avec saut de ligne',
        { SMTP_DKIM_SELECTOR: 'sel\nBcc: x' },
      ],
      ['un domaine vide de sens', { SMTP_DKIM_DOMAIN: 'pas un domaine' }],
    ])('refuse %s', (_label, overrides) => {
      // Ces valeurs sont concatenees telles quelles dans l'en-tete
      // `DKIM-Signature` : un saut de ligne y injecterait un en-tete
      // arbitraire dans tous les messages du transporter.
      configureSmtp();
      enableDkim(overrides);

      createOptionalSmtpTransporter(logger, 'Test');

      expect(lastOptions().dkim).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('ignore une configuration DKIM partielle et le signale', () => {
      configureSmtp();
      process.env.SMTP_DKIM_DOMAIN = 'asilidesign.fr';
      // selecteur et cle manquants

      createOptionalSmtpTransporter(logger, 'Test');

      // Une signature partielle est impossible : mieux vaut ne pas
      // signer et le dire que d'echouer silencieusement a l'envoi.
      // Niveau `error` et non `warn` : une configuration DKIM a moitie
      // posee est une erreur de deploiement, pas un mode degrade normal.
      expect(lastOptions().dkim).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
