import { createTransport } from 'nodemailer';
import {
  createMockTransporter,
  setSmtpEnv,
} from '../../../../test/factories/mailer.factory';
import type {
  CopieEtudiant,
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from '../domain/IFormationMailer.port';
import { FormationMailerService } from './FormationMailer.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockedCreateTransport = createTransport as jest.MockedFunction<
  typeof createTransport
>;

function buildParticipant(
  overrides: Partial<RapportParticipant> = {},
): RapportParticipant {
  return {
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
    completion: 1,
    note: 20,
    sousSeuil: false,
    reponses: [],
    incidents: 0,
    ...overrides,
  };
}

function buildRapport(overrides: Partial<RapportSession> = {}): RapportSession {
  return {
    courseSlug: 'b1-09-interets-composes',
    code: '4271',
    ouverteLe: new Date('2026-09-11T08:00:00.000Z'),
    fermeeLe: new Date('2026-09-11T11:30:00.000Z'),
    participants: [buildParticipant()],
    conceptsFragiles: [],
    ...overrides,
  };
}

function buildCopie(overrides: Partial<CopieEtudiant> = {}): CopieEtudiant {
  return {
    courseSlug: 'b1-09-interets-composes',
    code: '4271',
    participant: buildParticipant(),
    lienRevision: 'https://asilidesign.fr/cours/revision?token=abc123',
    ...overrides,
  };
}

function buildReponse(
  overrides: Partial<RapportQuestion> = {},
): RapportQuestion {
  return {
    questionId: 'Q-1',
    concept: 'capitalisation',
    valeur: '10',
    correcte: true,
    misconception: null,
    dureeMs: 1000,
    ...overrides,
  };
}

function buildRapportAvecReponses(
  reponses: readonly RapportQuestion[],
  participantOverrides: Partial<RapportParticipant> = {},
): RapportSession {
  return buildRapport({
    participants: [buildParticipant({ ...participantOverrides, reponses })],
  });
}

describe('FormationMailerService', () => {
  let cleanupEnv: () => void;
  let mockTransporter: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
    mockedCreateTransport.mockReset();
  });

  it('ne fait rien quand le SMTP n est pas configure', async () => {
    cleanupEnv = setSmtpEnv({
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    });
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const service = new FormationMailerService();
    await service.sendSyntheseFormateur('prof@example.com', buildRapport());
    await service.sendCopieEtudiant(
      buildCopie({
        lienRevision: 'https://asilidesign.fr/cours/revision?token=abc',
      }),
    );

    expect(mockedCreateTransport).not.toHaveBeenCalled();
  });

  describe('sendSyntheseFormateur', () => {
    beforeEach(() => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
    });

    async function envoyerEtObtenirCsv(
      rapport: RapportSession,
    ): Promise<string> {
      const service = new FormationMailerService();
      await service.sendSyntheseFormateur('prof@example.com', rapport);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      return call.attachments[0].content;
    }

    it('envoie un mail au destinataire avec un texte et un csv joint', async () => {
      const service = new FormationMailerService();
      const rapport = buildRapport();

      await service.sendSyntheseFormateur('prof@example.com', rapport);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.to).toBe('prof@example.com');
      expect(call.subject).toContain('4271');
      expect(call.text).toContain('4271');
      expect(call.html).toContain('4271');
      expect(call.attachments).toHaveLength(1);
      expect(call.attachments[0].filename).toBe('session-4271.csv');
      expect(call.attachments[0].contentType).toBe('text/csv; charset=utf-8');
    });

    it('produit un csv au format Excel francais : BOM, point-virgule, CRLF', async () => {
      const rapport = buildRapportAvecReponses([
        buildReponse({
          questionId: 'Q-CAP-03',
          valeur: '1338.23',
          dureeMs: 42000,
        }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv.charCodeAt(0)).toBe(0xfeff);
      const lignes = csv.slice(1).split('\r\n');
      expect(lignes[0]).toBe(
        'prénom;nom;email;question;concept;réponse;correcte;misconception;durée_ms',
      );
      expect(lignes[1]).toContain(';');
      expect(lignes[1]).not.toContain(',');
    });

    it('neutralise un nom d etudiant commencant par un signe egal', async () => {
      const rapport = buildRapportAvecReponses([buildReponse()], {
        prenom: '=HYPERLINK("http://evil.example","Cliquez ici")',
      });

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv).toContain('"\'=HYPERLINK');
    });

    it('laisse un montant negatif intact et sommable dans le csv', async () => {
      const rapport = buildRapportAvecReponses([
        buildReponse({ valeur: '-1500' }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv).toContain('"-1500"');
      expect(csv).not.toContain('"\'-1500"');
    });

    it('neutralise une reponse commencant par un signe plus ou une arobase', async () => {
      const rapport = buildRapportAvecReponses([
        buildReponse({ questionId: 'Q-1', valeur: '+1+1', correcte: false }),
        buildReponse({
          questionId: 'Q-2',
          valeur: '@SUM(A1)',
          correcte: false,
        }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv).toContain('"\'+1+1"');
      expect(csv).toContain('"\'@SUM(A1)"');
    });

    it('neutralise une reponse commencant par un signe moins qui n est pas un nombre valide', async () => {
      const rapport = buildRapportAvecReponses([
        buildReponse({ questionId: 'Q-1', valeur: '-=1+1', correcte: false }),
        buildReponse({ questionId: 'Q-2', valeur: '--cmd', correcte: false }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv).toContain('"\'-=1+1"');
      expect(csv).toContain('"\'--cmd"');
    });

    it('echappe une apostrophe dans le nom de famille d un etudiant', async () => {
      const service = new FormationMailerService();
      const rapport = buildRapport({
        participants: [buildParticipant({ nom: "O'Brien" })],
      });

      await service.sendSyntheseFormateur('prof@example.com', rapport);

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain("O'Brien");
      expect(call.html).toContain('O&#39;Brien');
    });

    it('remonte les concepts fragiles dans le texte et le html', async () => {
      const service = new FormationMailerService();
      const rapport = buildRapport({ conceptsFragiles: ['interet-simple'] });

      await service.sendSyntheseFormateur('prof@example.com', rapport);

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.text).toContain('interet-simple');
      expect(call.html).toContain('interet-simple');
    });
  });

  describe('sendCopieEtudiant', () => {
    beforeEach(() => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
    });

    it('envoie la copie au participant avec un lien de revision', async () => {
      const service = new FormationMailerService();
      const copie = buildCopie();

      await service.sendCopieEtudiant(copie);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.to).toBe(copie.participant.email);
      expect(call.text).toContain(copie.lienRevision);
      expect(call.html).toContain(copie.lienRevision);
      expect(call.subject).toContain(copie.courseSlug);
    });

    it('echappe le prenom de l etudiant dans la copie', async () => {
      const service = new FormationMailerService();

      await service.sendCopieEtudiant(
        buildCopie({
          participant: buildParticipant({ prenom: 'Bri<script>an' }),
        }),
      );

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
    });

    it('neutralise un lien de revision hors http/https', async () => {
      const service = new FormationMailerService();

      await service.sendCopieEtudiant(
        buildCopie({ lienRevision: 'javascript:alert(1)' }),
      );

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('javascript:alert');
      expect(call.html).toContain('href="#"');
    });
  });
});
