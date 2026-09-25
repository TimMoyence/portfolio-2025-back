import { readFileSync } from 'fs';
import { join } from 'path';

const RENDERERS = [
  'src/modules/audit-requests/infrastructure/automation/audit-report-html-renderer.service.ts',
  'src/modules/audit-requests/infrastructure/mail/audit-client-report.mailer.ts',
  'src/modules/audit-requests/infrastructure/mail/audit-expert-report.mailer.ts',
  'src/modules/audit-requests/infrastructure/mail/audit-notification.mailer.ts',
  'src/modules/audit-requests/infrastructure/mail/mail-layout.util.ts',
  'src/modules/contacts/infrastructure/ContactMailer.service.ts',
  'src/modules/lead-magnets/infrastructure/LeadMagnetMailer.service.ts',
  'src/modules/lead-magnets/infrastructure/ToolkitHtmlRenderer.service.ts',
  'src/modules/lead-magnets/infrastructure/toolkit-html/toolkit-html.css.ts',
  'src/modules/lead-magnets/infrastructure/toolkit-html/toolkit-html.utils.ts',
  'src/modules/newsletter/infrastructure/NewsletterMailer.service.ts',
  'src/modules/users/infrastructure/MailerDeLienTemporaire.ts',
  'src/modules/users/infrastructure/PasswordResetMailer.service.ts',
  'src/modules/users/infrastructure/VerificationMailer.service.ts',
];

const read = (relativePath: string): string =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('Renderers HTML — garanties non observables par le compilateur', () => {
  it.each(RENDERERS)('%s assemble son HTML via le tag safeHtml', (file) => {
    expect(read(file)).toMatch(/\bsafeHtml`/);
  });

  it.each(RENDERERS)(
    '%s ne laisse aucun gabarit HTML nu — un litteral sans tag accepte toute string sans casser la compilation',
    (file) => {
      const content = read(file);

      expect(content).not.toMatch(/html:\s*`/);
      expect(content).not.toMatch(/return\s+`\s*</);
      expect(content).not.toMatch(/\s[?:]\s*`\s*</);
    },
  );

  it.each(RENDERERS)('%s echappe via escapeHtml, jamais a la main', (file) => {
    const content = read(file);

    expect(content).not.toMatch(/replaceAll\(\s*'&'/);
    expect(content).not.toMatch(/replace\(\s*\/&\/g/);
  });
});
