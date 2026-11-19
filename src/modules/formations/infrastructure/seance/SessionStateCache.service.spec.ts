import { buildLiveSessionState } from '../../../../../test/factories/formations/formation.factory';
import { SessionStateCacheService } from './SessionStateCache.service';

describe('SessionStateCacheService', () => {
  let sut: SessionStateCacheService;

  const etat = buildLiveSessionState({ ecranCourant: 3 });

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

  it('garde l etat de revision plus recente quand une publication plus ancienne arrive apres', () => {
    sut.publish('session-uuid', { ...etat, revision: 8, ecranCourant: 4 });
    sut.publish('session-uuid', { ...etat, revision: 7, ecranCourant: 3 });

    expect(sut.read('session-uuid')).toMatchObject({
      revision: 8,
      ecranCourant: 4,
    });
  });

  it('garde comme plancher la revision publiee quand le retrait en porte une plus ancienne', () => {
    sut.publish('session-uuid', { ...etat, revision: 6, etat: 'en_cours' });
    sut.drop('session-uuid', 5);
    sut.publish('session-uuid', { ...etat, revision: 5, etat: 'terminee' });
    expect(sut.read('session-uuid')).toBeNull();

    sut.publish('session-uuid', { ...etat, revision: 6, etat: 'en_cours' });
    expect(sut.read('session-uuid')?.revision).toBe(6);
  });

  it('oublie une session retiree', () => {
    sut.publish('session-uuid', etat);
    sut.drop('session-uuid', etat.revision);
    expect(sut.read('session-uuid')).toBeNull();
  });

  it('refuse apres le retrait une lecture anterieure a la revision du retrait, et garde celle qui la suit', () => {
    sut.drop('session-uuid', 5);
    sut.publish('session-uuid', { ...etat, revision: 4, etat: 'en_cours' });
    expect(sut.read('session-uuid')).toBeNull();

    sut.publish('session-uuid', { ...etat, revision: 5, etat: 'terminee' });
    expect(sut.read('session-uuid')).toMatchObject({
      revision: 5,
      etat: 'terminee',
    });
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
    sut.drop('session-uuid', 0);
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

  it('produit une empreinte differente quand la revision change', () => {
    expect(sut.fingerprint(etat)).not.toBe(
      sut.fingerprint({ ...etat, revision: etat.revision + 1 }),
    );
  });
});
