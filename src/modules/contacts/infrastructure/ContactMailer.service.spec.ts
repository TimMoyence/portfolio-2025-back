import { buildContact } from '../../../../test/factories/contacts.factory';
import {
  attendreScriptEchappe,
  envoiSmtpSimule,
  mailSimule,
  moduleSmtpSimule,
} from '../../../../test/factories/mailer.factory';

jest.mock('../../../common/infrastructure/mail/smtp-transporter.util', () =>
  moduleSmtpSimule(),
);

import { ContactMailerService } from './ContactMailer.service';

describe('ContactMailerService', () => {
  beforeEach(() => {
    envoiSmtpSimule.mockClear();
  });

  it('echappe chaque champ saisi dans le HTML de la notification', async () => {
    await new ContactMailerService().sendContactNotification(
      buildContact({
        message: '<script>alert("xss")</script>',
        subject: "Tom & Jerry's <adventure>",
      }),
    );

    const { html } = mailSimule();
    attendreScriptEchappe(html);
    expect(html).toContain('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
  });

  it('lie l email du contact par un mailto passe par escapeUrl', async () => {
    await new ContactMailerService().sendContactNotification(
      buildContact({ email: 'jean@example.com' }),
    );

    expect(mailSimule().html).toContain(
      '<a href="mailto:jean@example.com">jean@example.com</a>',
    );
  });
});
