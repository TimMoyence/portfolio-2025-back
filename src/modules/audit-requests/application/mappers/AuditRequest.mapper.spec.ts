import { BadRequestException } from '@nestjs/common';
import { CreateAuditRequestCommand } from '../dto/CreateAuditRequest.command';
import { AuditRequestMapper } from './AuditRequest.mapper';

describe('AuditRequestMapper', () => {
  const baseCommand: CreateAuditRequestCommand = {
    websiteName: 'Example Studio',
    contactMethod: 'EMAIL',
    contactValue: 'hello@example.com',
    locale: 'fr',
    ip: null,
    userAgent: null,
    referer: null,
  };

  it('trims website name, normalizes locale and email', () => {
    const mapped = AuditRequestMapper.fromCreateCommand({
      ...baseCommand,
      websiteName: '  Example Studio  ',
      contactValue: '  HELLO@Example.com ',
      locale: 'en',
    });

    expect(mapped.websiteName).toBe('Example Studio');
    expect(mapped.contactValue).toBe('hello@example.com');
    expect(mapped.locale).toBe('en');
  });

  it('normalizes phone when contact method is phone', () => {
    const mapped = AuditRequestMapper.fromCreateCommand({
      ...baseCommand,
      contactMethod: 'PHONE',
      contactValue: '00 33 6 12 34 56 78',
    });

    expect(mapped.contactValue).toBe('+33612345678');
  });

  it('throws for invalid website name', () => {
    expect(() =>
      AuditRequestMapper.fromCreateCommand({
        ...baseCommand,
        websiteName: ' ',
      }),
    ).toThrow(BadRequestException);
  });

  it('throws for invalid contact value according to contact method', () => {
    expect(() =>
      AuditRequestMapper.fromCreateCommand({
        ...baseCommand,
        contactMethod: 'EMAIL',
        contactValue: 'invalid-email',
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      AuditRequestMapper.fromCreateCommand({
        ...baseCommand,
        contactMethod: 'PHONE',
        contactValue: 'invalid-phone',
      }),
    ).toThrow(BadRequestException);
  });
});
