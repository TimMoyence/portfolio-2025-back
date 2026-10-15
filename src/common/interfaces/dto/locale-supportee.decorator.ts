import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../domain/value-objects/LocaleCode';

interface OptionsDeLocale {
  facultative?: boolean;
  parDefaut?: SupportedLocale;
}

export function LocaleSupportee({
  facultative = false,
  parDefaut,
}: OptionsDeLocale = {}): PropertyDecorator {
  const documentation = {
    example: 'fr',
    enum: [...LOCALES_SUPPORTEES],
    ...(parDefaut === undefined ? {} : { default: parDefaut }),
  };
  const presence = facultative
    ? [ApiPropertyOptional(documentation), IsOptional()]
    : [ApiProperty(documentation)];
  return applyDecorators(...presence, IsIn(LOCALES_SUPPORTEES));
}
