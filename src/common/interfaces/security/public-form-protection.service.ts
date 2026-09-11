import { BadRequestException, Injectable } from '@nestjs/common';

const MIN_FORM_DURATION_MS = 1_200;

export interface PublicFormProtectionInput {
  honeypot?: unknown;
  formStartedAt?: unknown;
  now?: number;
}

@Injectable()
export class PublicFormProtectionService {
  assertHuman(input: PublicFormProtectionInput): void {
    const honeypot = input.honeypot;
    const formStartedAt = input.formStartedAt;

    if (
      (typeof honeypot === 'string' && honeypot.trim().length > 0) ||
      (honeypot !== undefined &&
        honeypot !== null &&
        typeof honeypot !== 'string')
    ) {
      throw new BadRequestException('Invalid request');
    }

    if (formStartedAt === undefined || formStartedAt === null) return;

    if (typeof formStartedAt !== 'number' || !Number.isFinite(formStartedAt)) {
      throw new BadRequestException('Invalid request');
    }

    const now = input.now ?? Date.now();
    if (now - formStartedAt < MIN_FORM_DURATION_MS) {
      throw new BadRequestException('Invalid request');
    }
  }
}
