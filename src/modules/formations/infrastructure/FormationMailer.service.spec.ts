import {
  attendreScriptEchappe,
  creationDeTransportSimulee,
  nodemailerSimule,
  smtpSimule,
  type MailEnvoye,
} from '../../../../test/factories/mailer.factory';
import type {
  CopieEtudiant,
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from '../domain/IFormationMailer.port';
import { FormationMailerService } from './FormationMailer.service';

jest.mock('nodemailer', () => nodemailerSimule());

const LIBELLE_CONFUSION = 'Croire que la hausse et la baisse s annulent.';

const mockedCreateTransport = creationDeTransportSimulee();

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

function lignePortant(texte: string, marqueur: string): string {
  return texte.split('\n').find((ligne) => ligne.includes(marqueur)) ?? '';
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
    type: 'numeric',
    score: null,
    valeur: '10',
    reponse: '10',
    correcte: true,
    misconception: null,
    libelleConfusion: null,
    dureeMs: 1000,
    ...overrides,
  };
}

const VOTE_CONFONDU = buildReponse({
  questionId: 'Q-VOTE',
  valeur: 'o3',
  reponse: 'revenu au prix de départ',
  correcte: false,
  misconception: 'hausse-baisse-symetriques',
  libelleConfusion: LIBELLE_CONFUSION,
});

function buildRapportAvecReponses(
  reponses: readonly RapportQuestion[],
  participantOverrides: Partial<RapportParticipant> = {},
): RapportSession {
  return buildRapport({
    participants: [buildParticipant({ ...participantOverrides, reponses })],
  });
}

describe('FormationMailerService', () => {
  const smtp = smtpSimule(mockedCreateTransport);

  it('ne fait rien quand le SMTP n est pas configure', async () => {
    smtp.retirer();

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
      smtp.brancher();
    });

    async function synthese(rapport: RapportSession): Promise<MailEnvoye> {
      await new FormationMailerService().sendSyntheseFormateur(
        'prof@example.com',
        rapport,
      );
      return smtp.premierMail();
    }

    async function envoyerEtObtenirCsv(
      rapport: RapportSession,
    ): Promise<string> {
      const mail = await synthese(rapport);
      return String(mail.attachments?.[0].content);
    }

    it('envoie un mail au destinataire avec un texte et un csv joint', async () => {
      const mail = await synthese(buildRapport());

      expect(smtp.transporteur().sendMail).toHaveBeenCalledTimes(1);
      expect(mail.to).toBe('prof@example.com');
      expect(mail.subject).toContain('4271');
      expect(mail.text).toContain('4271');
      expect(mail.html).toContain('4271');
      expect(mail.attachments).toHaveLength(1);
      expect(mail.attachments?.[0].filename).toBe('session-4271.csv');
      expect(mail.attachments?.[0].contentType).toBe('text/csv; charset=utf-8');
    });

    it('produit un csv au format Excel francais : BOM, point-virgule, CRLF', async () => {
      const rapport = buildRapportAvecReponses([
        buildReponse({
          questionId: 'Q-CAP-03',
          valeur: '1338.23',
          reponse: '1338.23',
          dureeMs: 42000,
        }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv.charCodeAt(0)).toBe(0xfeff);
      const lignes = csv.slice(1).split('\r\n');
      expect(lignes[0]).toBe(
        'prénom;nom;email;question;concept;réponse;correcte;confusion;durée_ms',
      );
      expect(lignes[1]).toContain(';');
      expect(lignes[1]).not.toContain(',');
    });

    it('ecrit dans le csv le libelle de l option choisie et celui de la confusion, jamais leurs identifiants', async () => {
      const csv = await envoyerEtObtenirCsv(
        buildRapportAvecReponses([VOTE_CONFONDU]),
      );
      const cellules = csv.slice(1).split('\r\n')[1].split(';');

      expect({ reponse: cellules[5], confusion: cellules[7] }).toEqual({
        reponse: '"revenu au prix de départ"',
        confusion: `"${LIBELLE_CONFUSION}"`,
      });
      expect(csv).not.toContain('"o3"');
      expect(csv).not.toContain('hausse-baisse-symetriques');
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
        buildReponse({ valeur: '-1500', reponse: '-1500' }),
      ]);

      const csv = await envoyerEtObtenirCsv(rapport);

      expect(csv).toContain('"-1500"');
      expect(csv).not.toContain('"\'-1500"');
    });

    it.each([
      ['un signe plus ou une arobase', '+1+1', '@SUM(A1)'],
      ['un signe moins qui n est pas un nombre valide', '-=1+1', '--cmd'],
    ])(
      'neutralise une reponse commencant par %s',
      async (_cas, premiere, seconde) => {
        const rapport = buildRapportAvecReponses([
          buildReponse({
            questionId: 'Q-1',
            reponse: premiere,
            correcte: false,
          }),
          buildReponse({
            questionId: 'Q-2',
            reponse: seconde,
            correcte: false,
          }),
        ]);

        const csv = await envoyerEtObtenirCsv(rapport);

        expect(csv).toContain(`"'${premiere}"`);
        expect(csv).toContain(`"'${seconde}"`);
      },
    );

    it('echappe une apostrophe dans le nom de famille d un etudiant', async () => {
      const mail = await synthese(
        buildRapportAvecReponses([], { nom: "O'Brien" }),
      );

      expect(mail.html).not.toContain("O'Brien");
      expect(mail.html).toContain('O&#39;Brien');
    });

    it('remonte les concepts fragiles dans le texte et le html', async () => {
      const mail = await synthese(
        buildRapport({ conceptsFragiles: ['interet-simple'] }),
      );

      expect(mail.text).toContain('interet-simple');
      expect(mail.html).toContain('interet-simple');
    });
  });

  describe('sendCopieEtudiant', () => {
    beforeEach(() => {
      smtp.brancher();
    });

    async function copie(
      overrides: Partial<CopieEtudiant> = {},
    ): Promise<MailEnvoye> {
      await new FormationMailerService().sendCopieEtudiant(
        buildCopie(overrides),
      );
      return smtp.premierMail();
    }

    const copieAvec = (participant: Partial<RapportParticipant>) =>
      copie({ participant: buildParticipant(participant) });

    it('envoie la copie au participant avec un lien de revision', async () => {
      const attendue = buildCopie();

      const mail = await copie();

      expect(smtp.transporteur().sendMail).toHaveBeenCalledTimes(1);
      expect(mail.to).toBe(attendue.participant.email);
      expect(mail.text).toContain(attendue.lienRevision);
      expect(mail.html).toContain(attendue.lienRevision);
      expect(mail.subject).toContain(attendue.courseSlug);
    });

    it('detaille chaque reponse avec son verdict, comme le promet le message', async () => {
      const mail = await copieAvec({
        reponses: [
          buildReponse({
            questionId: 'Q-CAP-03',
            concept: 'capitalisation',
            reponse: '1 400',
            correcte: false,
            misconception: 'interet-simple',
            libelleConfusion: 'Confondre interet simple et interet compose',
          }),
          buildReponse({
            questionId: 'Q-CAP-07',
            concept: 'actualisation',
            reponse: '1 480,24',
            correcte: true,
          }),
        ],
      });

      for (const rendu of [mail.text, mail.html]) {
        expect(rendu).toContain('Q-CAP-03');
        expect(rendu).toContain('1 400');
        expect(rendu).toContain('Confondre interet simple et interet compose');
        expect(rendu).toContain('Q-CAP-07');
        expect(rendu).toContain('1 480,24');
      }
    });

    it('montre a l etudiant l option qu il a choisie et sa confusion par leurs libelles, jamais par leurs identifiants', async () => {
      const mail = await copieAvec({ reponses: [VOTE_CONFONDU] });

      for (const rendu of [mail.text, mail.html]) {
        expect(rendu).toContain('revenu au prix de départ');
        expect(rendu).toContain(LIBELLE_CONFUSION);
        expect(rendu).not.toContain('« o3 »');
        expect(rendu).not.toContain('hausse-baisse-symetriques');
      }
    });

    it('distingue une reponse juste d une reponse fausse autrement que par leur ordre', async () => {
      const mail = await copieAvec({
        reponses: [
          buildReponse({ questionId: 'Q-JUSTE', correcte: true }),
          buildReponse({ questionId: 'Q-FAUSSE', correcte: false }),
        ],
      });

      const ligneJuste = lignePortant(mail.text, 'Q-JUSTE');
      const ligneFausse = lignePortant(mail.text, 'Q-FAUSSE');
      expect(ligneJuste).not.toBe(ligneFausse);
      expect(ligneJuste.replace('Q-JUSTE', '')).not.toBe(
        ligneFausse.replace('Q-FAUSSE', ''),
      );
    });

    it('echappe une reponse d etudiant qui porte du balisage', async () => {
      const mail = await copieAvec({
        reponses: [buildReponse({ reponse: '<img src=x onerror=alert(1)>' })],
      });

      expect(mail.html).not.toContain('<img src=x');
      expect(mail.html).toContain('&lt;img');
    });

    it('echappe le prenom de l etudiant dans la copie', async () => {
      const mail = await copieAvec({ prenom: 'Bri<script>an' });

      attendreScriptEchappe(mail.html);
    });

    it('neutralise un lien de revision hors http/https', async () => {
      const mail = await copie({ lienRevision: 'javascript:alert(1)' });

      expect(mail.html).not.toContain('javascript:alert');
      expect(mail.html).toContain('href="#"');
    });
  });
});
