import type { Request } from 'express';
import { resolveClientIp, resolveClientIpOrUnknown } from '../client-ip.util';

const EXPRESS_IP = '192.0.2.10';
const FORGED_IP = '198.51.100.99';

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
    const req = buildRequest({ ip: EXPRESS_IP });

    expect(resolveClientIp(req)).toBe(EXPRESS_IP);
  });

  it('ignore un X-Forwarded-For forge', () => {
    const req = buildRequest({
      ip: EXPRESS_IP,
      headers: { 'x-forwarded-for': `${FORGED_IP}, 198.51.100.8` },
    });

    expect(resolveClientIp(req)).toBe(EXPRESS_IP);
    expect(resolveClientIp(req)).not.toBe(FORGED_IP);
  });

  it('ignore un X-Real-IP forge', () => {
    const req = buildRequest({
      ip: EXPRESS_IP,
      headers: { 'x-real-ip': FORGED_IP },
    });

    expect(resolveClientIp(req)).toBe(EXPRESS_IP);
  });

  it('retombe sur l’adresse du socket quand req.ip est absent', () => {
    const req = buildRequest({ remoteAddress: '203.0.113.7' });

    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  it('normalise la forme IPv4-mappee-IPv6', () => {
    const mapped = '203.0.113.18';
    const req = buildRequest({ ip: `::ffff:${mapped}` });

    expect(resolveClientIp(req)).toBe(mapped);
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
    expect(resolveClientIpOrUnknown(buildRequest({ ip: EXPRESS_IP }))).toBe(
      EXPRESS_IP,
    );
  });
});
