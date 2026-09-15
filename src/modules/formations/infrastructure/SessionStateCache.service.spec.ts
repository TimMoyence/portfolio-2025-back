import { SessionStateCacheService } from './SessionStateCache.service';

describe('SessionStateCacheService', () => {
  let sut: SessionStateCacheService;

  const etat = {
    etat: 'en_cours' as const,
    modeRythme: 'pilote' as const,
    ecranCourant: 3,
    intervalleLibre: null,
    participants: 12,
    majLe: new Date('2026-09-11T08:00:00.000Z'),
  };

  beforeEach(() => {
    sut = new SessionStateCacheService();
  });

  it('retourne null pour une session inconnue', () => {
    expect(sut.read('session-uuid')).toBeNull();
  });

  it('relit l etat publie', () => {
    sut.publish('session-uuid', etat);
    expect(sut.read('session-uuid')?.ecranCourant).toBe(3);
  });

  it('ecrase l etat precedent', () => {
    sut.publish('session-uuid', etat);
    sut.publish('session-uuid', { ...etat, ecranCourant: 7 });
    expect(sut.read('session-uuid')?.ecranCourant).toBe(7);
  });

  it('oublie une session retiree', () => {
    sut.publish('session-uuid', etat);
    sut.drop('session-uuid');
    expect(sut.read('session-uuid')).toBeNull();
  });

  it('ne compte aucune activite sur une session inconnue', () => {
    expect(sut.activite('session-uuid')).toBe(0);
  });

  it('incremente l activite a chaque signalement', () => {
    sut.signalerActivite('session-uuid');
    sut.signalerActivite('session-uuid');
    expect(sut.activite('session-uuid')).toBe(2);
  });

  it('compte l activite de chaque session separement', () => {
    sut.signalerActivite('session-uuid');
    expect(sut.activite('autre-session')).toBe(0);
  });

  it('remet l activite a zero quand la session est retiree', () => {
    sut.signalerActivite('session-uuid');
    sut.drop('session-uuid');
    expect(sut.activite('session-uuid')).toBe(0);
  });

  it('produit une empreinte stable pour un etat identique', () => {
    expect(sut.fingerprint(etat)).toBe(sut.fingerprint({ ...etat }));
  });

  it('produit une empreinte differente quand l ecran change', () => {
    expect(sut.fingerprint(etat)).not.toBe(
      sut.fingerprint({ ...etat, ecranCourant: 4 }),
    );
  });

  it('produit une empreinte identique malgre un majLe different', () => {
    expect(sut.fingerprint(etat)).toBe(
      sut.fingerprint({ ...etat, majLe: new Date('2026-09-11T09:00:00.000Z') }),
    );
  });

  it('produit une empreinte differente quand l intervalle libre change', () => {
    expect(
      sut.fingerprint({ ...etat, intervalleLibre: { premier: 1, dernier: 2 } }),
    ).not.toBe(
      sut.fingerprint({ ...etat, intervalleLibre: { premier: 1, dernier: 3 } }),
    );
  });
});
