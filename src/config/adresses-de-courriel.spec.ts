import {
  adresseDeReponse,
  destinataireDesNotifications,
  destinataireDesRapportsDAudit,
  expediteurDesCourriels,
} from './adresses-de-courriel';

describe('adresses de courriel', () => {
  it('lit l expéditeur sans ses blancs et ignore une valeur vide', () => {
    expect(expediteurDesCourriels({ SMTP_FROM: ' Asili <a@b.fr> ' })).toBe(
      'Asili <a@b.fr>',
    );
    expect(expediteurDesCourriels({ SMTP_FROM: '  ' })).toBeUndefined();
  });

  it('répond à SMTP_REPLY_TO ou, à défaut, au contact du site', () => {
    expect(adresseDeReponse({ SMTP_REPLY_TO: 'r@b.fr' })).toBe('r@b.fr');
    expect(adresseDeReponse({ SMTP_REPLY_TO: '' })).toBe(
      'contact@asilidesign.fr',
    );
    expect(adresseDeReponse({})).toBe('contact@asilidesign.fr');
  });

  it('notifie CONTACT_NOTIFICATION_TO', () => {
    expect(
      destinataireDesNotifications({ CONTACT_NOTIFICATION_TO: 'n@b.fr' }),
    ).toBe('n@b.fr');
    expect(destinataireDesNotifications({})).toBeUndefined();
  });

  it('adresse les rapports d audit à AUDIT_REPORT_TO, sinon au destinataire des notifications', () => {
    const notifications = { CONTACT_NOTIFICATION_TO: 'n@b.fr' };

    expect(
      destinataireDesRapportsDAudit({
        ...notifications,
        AUDIT_REPORT_TO: 'r@b.fr',
      }),
    ).toBe('r@b.fr');
    expect(
      destinataireDesRapportsDAudit({ ...notifications, AUDIT_REPORT_TO: ' ' }),
    ).toBe('n@b.fr');
    expect(destinataireDesRapportsDAudit({})).toBeUndefined();
  });
});
