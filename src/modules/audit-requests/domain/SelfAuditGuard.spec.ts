import { SelfAuditForbiddenError, SelfAuditGuard } from './SelfAuditGuard';

describe('SelfAuditGuard', () => {
  const guard = new SelfAuditGuard(['asilidesign.fr', 'tim-moyence.dev']);

  describe('ensureNotSelf — refuse les domaines self', () => {
    it('bloque le domaine exact', () => {
      expect(() => guard.ensureNotSelf('asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le domaine avec scheme https', () => {
      expect(() => guard.ensureNotSelf('https://asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le domaine avec scheme http et trailing slash', () => {
      expect(() => guard.ensureNotSelf('http://asilidesign.fr/')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le domaine avec prefixe www', () => {
      expect(() => guard.ensureNotSelf('www.asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le domaine avec chemin', () => {
      expect(() =>
        guard.ensureNotSelf('https://asilidesign.fr/growth-audit'),
      ).toThrow(SelfAuditForbiddenError);
    });

    it('bloque le domaine avec port', () => {
      expect(() => guard.ensureNotSelf('asilidesign.fr:443')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le sous-domaine (api.asilidesign.fr)', () => {
      expect(() => guard.ensureNotSelf('api.asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque le sous-domaine multi-niveau (v2.api.asilidesign.fr)', () => {
      expect(() => guard.ensureNotSelf('v2.api.asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('bloque en ignorant la casse', () => {
      expect(() => guard.ensureNotSelf('ASILIDESIGN.FR')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('supporte plusieurs domaines self (tim-moyence.dev)', () => {
      expect(() => guard.ensureNotSelf('tim-moyence.dev')).toThrow(
        SelfAuditForbiddenError,
      );
    });
  });

  describe('ensureNotSelf — laisse passer les domaines tiers', () => {
    it('accepte un domaine tiers simple', () => {
      expect(() => guard.ensureNotSelf('example.com')).not.toThrow();
    });

    it('accepte un domaine qui contient la sous-chaine self mais sans correspondance de domaine', () => {
      expect(() => guard.ensureNotSelf('notasilidesign.fr')).not.toThrow();
      expect(() =>
        guard.ensureNotSelf('asilidesign.fr.evil.com'),
      ).not.toThrow();
    });

    it('accepte un domaine avec le meme suffixe mais different (.com au lieu de .fr)', () => {
      expect(() => guard.ensureNotSelf('asilidesign.com')).not.toThrow();
    });
  });

  describe('ensureNotSelf — tolere les entrees degenerees', () => {
    it('no-op sur chaine vide', () => {
      expect(() => guard.ensureNotSelf('')).not.toThrow();
    });

    it('no-op sur espaces uniquement', () => {
      expect(() => guard.ensureNotSelf('   ')).not.toThrow();
    });
  });

  describe('constructeur — normalise la liste des domaines self', () => {
    it('accepte des entrees avec scheme, www et casse', () => {
      const mixed = new SelfAuditGuard([
        'HTTPS://asilidesign.fr/',
        'www.tim-moyence.dev',
        '',
        '   ',
      ]);
      expect(() => mixed.ensureNotSelf('asilidesign.fr')).toThrow(
        SelfAuditForbiddenError,
      );
      expect(() => mixed.ensureNotSelf('tim-moyence.dev')).toThrow(
        SelfAuditForbiddenError,
      );
    });

    it('avec liste vide, laisse tout passer', () => {
      const empty = new SelfAuditGuard([]);
      expect(() => empty.ensureNotSelf('asilidesign.fr')).not.toThrow();
    });
  });

  describe('SelfAuditForbiddenError', () => {
    it('expose le hostname bloque dans le message', () => {
      try {
        guard.ensureNotSelf('https://api.asilidesign.fr/path');
        fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SelfAuditForbiddenError);
        expect((err as Error).message).toContain('api.asilidesign.fr');
      }
    });
  });
});
