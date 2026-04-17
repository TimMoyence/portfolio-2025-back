import { buildMailLayout } from './mail-layout.util';

describe('buildMailLayout (P2.7 / P6.6)', () => {
  const baseInput = {
    heroTitle: 'Test title',
    bodyHtml: '<p>body content</p>',
  };

  describe('structure HTML', () => {
    it('produit un document HTML5 complet avec DOCTYPE et meta viewport', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="fr">');
      expect(html).toContain('<meta charset="UTF-8" />');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('initial-scale=1');
    });

    it('declare le color-scheme light/dark pour compatibilite dark mode', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('<meta name="color-scheme" content="light dark"');
      expect(html).toContain(
        '<meta name="supported-color-schemes" content="light dark"',
      );
    });

    it('contient des media queries responsive < 600px', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('@media (max-width: 600px)');
    });

    it('applique un max-width 640px sur le conteneur principal', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('max-width:640px');
    });
  });

  describe('branding Asili Design', () => {
    it('inclut le logo header pointant vers le domaine principal', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('href="https://asilidesign.fr"');
      expect(html).toContain('alt="Asili Design — Tim Moyence"');
    });

    it("affiche l'adresse + contact dans le footer legal", () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('Asili Design — Bordeaux, France');
      expect(html).toContain('mailto:tim.moyence@outlook.fr');
    });

    it('linke vers la politique de confidentialite et les conditions', () => {
      const html = buildMailLayout(baseInput);
      expect(html).toContain('href="https://asilidesign.fr/fr/privacy"');
      expect(html).toContain('href="https://asilidesign.fr/fr/terms"');
    });
  });

  describe('hero title et subtitle', () => {
    it('rend heroTitle dans un h1 dans le bloc hero noir', () => {
      const html = buildMailLayout({
        ...baseInput,
        heroTitle: 'Mon audit pour example.com',
      });
      expect(html).toContain('Mon audit pour example.com');
      expect(html).toContain('background:#111');
    });

    it('rend heroSubtitle quand fourni', () => {
      const html = buildMailLayout({
        ...baseInput,
        heroSubtitle: 'Synthèse stratégique 7 piliers',
      });
      expect(html).toContain('Synthèse stratégique 7 piliers');
    });

    it('omet le subtitle quand absent', () => {
      const html = buildMailLayout(baseInput);
      expect(html).not.toContain('class="hero-subtitle"');
    });
  });

  describe('preheader inbox preview', () => {
    it('inclut le preheader en element cache quand fourni', () => {
      const html = buildMailLayout({
        ...baseInput,
        preheader: 'Apercu du mail dans la boite de reception',
      });
      expect(html).toContain('Apercu du mail');
      expect(html).toContain('display:none');
      expect(html).toContain('opacity:0');
    });

    it('omet le preheader quand absent', () => {
      const html = buildMailLayout(baseInput);
      expect(html).not.toContain('display:none;max-height:0');
    });
  });

  describe('unsubscribe RGPD', () => {
    it('affiche le lien unsubscribe quand showUnsubscribe=true', () => {
      const html = buildMailLayout({ ...baseInput, showUnsubscribe: true });
      expect(html).toContain("Ne plus recevoir ce type d'email");
    });

    it('omet le lien unsubscribe par defaut (mails internes)', () => {
      const html = buildMailLayout(baseInput);
      expect(html).not.toContain("Ne plus recevoir ce type d'email");
    });

    it('utilise unsubscribeUrl explicite quand fourni', () => {
      const html = buildMailLayout({
        ...baseInput,
        showUnsubscribe: true,
        unsubscribeUrl: 'https://cal.com/asili/unsub?token=xyz',
      });
      expect(html).toContain('href="https://cal.com/asili/unsub?token=xyz"');
    });

    it('fallback sur /fr/contact quand showUnsubscribe=true sans URL explicite', () => {
      delete process.env.AUDIT_UNSUBSCRIBE_URL;
      const html = buildMailLayout({ ...baseInput, showUnsubscribe: true });
      expect(html).toContain('href="https://asilidesign.fr/fr/contact"');
    });
  });

  describe('securite XSS', () => {
    it('echappe les tags HTML dans le heroTitle', () => {
      const html = buildMailLayout({
        ...baseInput,
        heroTitle: '<script>alert(1)</script>',
      });
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('echappe les tags HTML dans le heroSubtitle', () => {
      const html = buildMailLayout({
        ...baseInput,
        heroSubtitle: '<img src=x onerror=alert(1) />',
      });
      expect(html).not.toContain('<img src=x onerror');
      expect(html).toContain('&lt;img');
    });

    it('echappe les tags HTML dans le preheader', () => {
      const html = buildMailLayout({
        ...baseInput,
        preheader: '<script>evil()</script>',
      });
      expect(html).not.toContain('<script>evil()</script>');
      expect(html).toContain('&lt;script&gt;evil()&lt;/script&gt;');
    });

    it("laisse bodyHtml brut (l'appelant est responsable d'echapper les champs externes)", () => {
      // Le contrat : le body est considere deja safe (l'appelant passe du HTML
      // construit avec escapeHtml sur les donnees externes). Ce comportement
      // est explicite dans la doc de MailLayoutInput.bodyHtml.
      const html = buildMailLayout({
        ...baseInput,
        bodyHtml: '<p><strong>ok</strong></p>',
      });
      expect(html).toContain('<strong>ok</strong>');
    });
  });

  describe('env vars fallback', () => {
    it('utilise AUDIT_UNSUBSCRIBE_URL env quand showUnsubscribe=true sans URL explicite', () => {
      const original = process.env.AUDIT_UNSUBSCRIBE_URL;
      process.env.AUDIT_UNSUBSCRIBE_URL = 'https://preferences.asilidesign.fr';
      try {
        const html = buildMailLayout({ ...baseInput, showUnsubscribe: true });
        expect(html).toContain('href="https://preferences.asilidesign.fr"');
      } finally {
        if (original !== undefined) {
          process.env.AUDIT_UNSUBSCRIBE_URL = original;
        } else {
          delete process.env.AUDIT_UNSUBSCRIBE_URL;
        }
      }
    });
  });
});
