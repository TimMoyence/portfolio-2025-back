import { Logger } from '@nestjs/common';
import { AuthAuditLogger, AuthAuditEntry } from './AuthAuditLogger';

describe('AuthAuditLogger', () => {
  let auditLogger: AuthAuditLogger;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    auditLogger = new AuthAuditLogger();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('devrait logger un JSON structuré pour les événements auth', () => {
    const entry: AuthAuditEntry = {
      event: 'LOGIN_SUCCESS',
      email: 'user@example.com',
      userId: 'uuid-123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2026-04-06T12:00:00Z'),
      details: 'Connexion réussie',
    };

    auditLogger.log(entry);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const loggedArg = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(loggedArg) as AuthAuditEntry;

    expect(parsed.event).toBe('LOGIN_SUCCESS');
    expect(parsed.email).toBe('user@example.com');
    expect(parsed.userId).toBe('uuid-123');
    expect(parsed.ip).toBe('192.168.1.1');
    expect(parsed.userAgent).toBe('Mozilla/5.0');
    expect(parsed.timestamp).toBe('2026-04-06T12:00:00.000Z');
    expect(parsed.details).toBe('Connexion réussie');
  });

  it('devrait logger sans champs optionnels', () => {
    const entry: AuthAuditEntry = {
      event: 'LOGIN_FAILURE',
      ip: 'unknown',
      userAgent: 'unknown',
      timestamp: new Date('2026-04-06T12:00:00Z'),
    };

    auditLogger.log(entry);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);

    expect(parsed.event).toBe('LOGIN_FAILURE');
    expect(parsed.email).toBeUndefined();
    expect(parsed.userId).toBeUndefined();
    expect(parsed.details).toBeUndefined();
  });
});
