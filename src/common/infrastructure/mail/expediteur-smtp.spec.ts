import {
  createMockTransporter,
  premierMailEnvoye,
} from '../../../../test/factories/mailer.factory';
import { escapeHtml, safeHtml } from '../../domain/texte/html-escape.util';
import { ExpediteurDeCourriels, type CourrielHtml } from './expediteur-smtp';

const COURRIEL: CourrielHtml = {
  from: 'expediteur@test.local',
  to: 'a@b.fr',
  replyTo: 'reponse@test.local',
  subject: 'objet',
  text: 'texte',
  html: safeHtml`<p>${escapeHtml('<mot>')}</p>`,
  attachments: [
    {
      filename: 'rapport.pdf',
      content: Buffer.from('%PDF-1.4'),
      contentType: 'application/pdf',
    },
  ],
};

const envoyerA = (
  transporteur: ReturnType<typeof createMockTransporter>,
  courriel: unknown,
) => new ExpediteurDeCourriels(transporteur).envoyer(courriel as CourrielHtml);

describe('ExpediteurDeCourriels', () => {
  it('ne transmet au transporteur que les champs du courriel, le HTML emis compris', async () => {
    const transporteur = createMockTransporter();

    await envoyerA(transporteur, {
      ...COURRIEL,
      alternatives: [{ contentType: 'text/html', content: '<script>' }],
      amp: '<script>',
      watchHtml: '<script>',
      raw: 'Content-Type: text/html\r\n\r\n<script>',
      icalEvent: { content: '<script>' },
      headers: { 'X-Mailer': 'x', 'List-Id': 'x\r\nBcc: y' },
      attachments: [
        { ...COURRIEL.attachments?.[0], path: '/etc/passwd', href: 'x' },
      ],
    });

    expect(premierMailEnvoye(transporteur)).toEqual({
      ...COURRIEL,
      html: '<p>&lt;mot&gt;</p>',
      attachments: [
        {
          filename: 'rapport.pdf',
          content: Buffer.from('%PDF-1.4'),
          contentType: 'application/pdf',
        },
      ],
    });
  });

  it.each([
    ['un texte lu sur disque', { text: { path: '/etc/passwd' } }],
    ['un objet pour objet', { subject: { toString: () => 'objet' } }],
    [
      'une piece jointe HTML',
      {
        attachments: [
          {
            filename: 'a.html',
            content: Buffer.from('<b>'),
            contentType: 'text/html',
          },
        ],
      },
    ],
    [
      'une piece jointe lue sur disque',
      {
        attachments: [
          {
            filename: 'a.pdf',
            path: '/etc/passwd',
            contentType: 'application/pdf',
          },
        ],
      },
    ],
  ])('refuse %s sans rien envoyer', async (_cas, champs) => {
    const transporteur = createMockTransporter();

    await expect(
      envoyerA(transporteur, { ...COURRIEL, ...champs }),
    ).rejects.toThrow(/refusé/);
    expect(transporteur.sendMail).not.toHaveBeenCalled();
  });

  it('valide chaque piece jointe meme d un tableau a map propre', async () => {
    const transporteur = createMockTransporter();
    const attachments = Object.assign([...(COURRIEL.attachments ?? [])], {
      map: () => [{ path: '/etc/passwd' }],
    });

    await envoyerA(transporteur, { ...COURRIEL, attachments });

    expect(premierMailEnvoye(transporteur).attachments).toEqual(
      COURRIEL.attachments,
    );
  });

  it('ne garde le transporteur dans aucune propriete accessible', () => {
    const expediteur = new ExpediteurDeCourriels(createMockTransporter());

    expect(Reflect.ownKeys(expediteur)).toEqual([]);
    expect(new Set(Reflect.ownKeys(ExpediteurDeCourriels.prototype))).toEqual(
      new Set(['actif', 'constructor', 'envoyer']),
    );
    expect(expediteur.actif).toBe(true);
  });

  it('n envoie rien sans transporteur', async () => {
    const expediteur = new ExpediteurDeCourriels(null);

    expect(expediteur.actif).toBe(false);
    await expect(expediteur.envoyer(COURRIEL)).resolves.toBeUndefined();
  });

  it('refuse a la compilation les champs HTML de nodemailer hors du courriel', () => {
    const courriel = (champs: CourrielHtml): CourrielHtml => champs;

    // @ts-expect-error alternatives n'est pas un champ du courriel
    expect(courriel({ ...COURRIEL, alternatives: [] })).toBeDefined();
    // @ts-expect-error amp n'est pas un champ du courriel
    expect(courriel({ ...COURRIEL, amp: '' })).toBeDefined();
    // @ts-expect-error watchHtml n'est pas un champ du courriel
    expect(courriel({ ...COURRIEL, watchHtml: '' })).toBeDefined();
    // @ts-expect-error raw n'est pas un champ du courriel
    expect(courriel({ ...COURRIEL, raw: '' })).toBeDefined();
  });
});
