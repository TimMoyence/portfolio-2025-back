import { BadRequestException } from '@nestjs/common';
import { PublicFormProtectionService } from './public-form-protection.service';

describe('PublicFormProtectionService', () => {
  const service = new PublicFormProtectionService();

  it('laisse passer une soumission humaine après le délai minimal', () => {
    expect(() =>
      service.assertHuman({
        honeypot: '',
        formStartedAt: 1_000,
        now: 2_500,
      }),
    ).not.toThrow();
  });

  it('rejette un honeypot rempli avec une erreur générique', () => {
    expect(() =>
      service.assertHuman({ honeypot: 'https://spam.test' }),
    ).toThrow(new BadRequestException('Invalid request'));
  });

  it('rejette une soumission trop rapide', () => {
    expect(() =>
      service.assertHuman({
        honeypot: '',
        formStartedAt: 2_000,
        now: 2_999,
      }),
    ).toThrow(new BadRequestException('Invalid request'));
  });

  it('reste rétrocompatible avec les clients qui ne connaissent pas encore les champs', () => {
    expect(() => service.assertHuman({})).not.toThrow();
  });
});
