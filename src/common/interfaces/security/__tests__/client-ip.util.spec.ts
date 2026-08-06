import type { Request } from 'express';
import { resolveClientIp, resolveClientIpOrUnknown } from '../client-ip.util';

function buildRequest(overrides: {
  ip?: string;
  remoteAddress?: string;
  headers?: Record<string, string>;
}): Request {
  return {
    ip: overrides.ip,
    socket: { remoteAddress: overrides.remoteAddress },
    headers: overrides.headers ?? {},
  } as unknown as Request;
}

describe('resolveClientIp', () => {
  it('retourne l’IP calculee par Express', () => {
    const req = buildRequest({ ip: '88.88.88.88' });

    expect(resolveClientIp(req)).toBe('88.88.88.88');
  });

  it('ignore un X-Forwarded-For forge', () => {
    // L'en-tete est fourni en entier par le client : en retenir la
    // premiere entree laisserait l'appelant choisir l'IP sous laquelle
    // il est trace, et attribuer son activite a un tiers.
    const req = buildRequest({
      ip: '88.88.88.88',
      headers: { 'x-forwarded-for': '9.9.9.9, 8.8.8.8' },
    });

    expect(resolveClientIp(req)).toBe('88.88.88.88');
    expect(resolveClientIp(req)).not.toBe('9.9.9.9');
  });

  it('ignore un X-Real-IP forge', () => {
    const req = buildRequest({
      ip: '88.88.88.88',
      headers: { 'x-real-ip': '9.9.9.9' },
    });

    expect(resolveClientIp(req)).toBe('88.88.88.88');
  });

  it('retombe sur l’adresse du socket quand req.ip est absent', () => {
    const req = buildRequest({ remoteAddress: '203.0.113.7' });

    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  it('normalise la forme IPv4-mappee-IPv6', () => {
    // Sans normalisation, `::ffff:1.2.3.4` et `1.2.3.4` comptent comme
    // deux clients distincts dans les agregats.
    const req = buildRequest({ ip: '::ffff:172.18.0.1' });

    expect(resolveClientIp(req)).toBe('172.18.0.1');
  });

  it('laisse une adresse IPv6 native intacte', () => {
    const req = buildRequest({ ip: '2001:db8::1' });

    expect(resolveClientIp(req)).toBe('2001:db8::1');
  });

  it('retourne null quand aucune adresse n’est disponible', () => {
    expect(resolveClientIp(buildRequest({}))).toBeNull();
  });

  it('retourne unknown dans la variante non-nullable', () => {
    expect(resolveClientIpOrUnknown(buildRequest({}))).toBe('unknown');
    expect(resolveClientIpOrUnknown(buildRequest({ ip: '1.2.3.4' }))).toBe(
      '1.2.3.4',
    );
  });
});
