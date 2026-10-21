import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { buildMessage, IsOptional, ValidateBy } from 'class-validator';
import {
  estUneLocaleSupportee,
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
    enumName: 'Locale',
    enum: [...LOCALES_SUPPORTEES],
    ...(parDefaut === undefined ? {} : { default: parDefaut }),
  };
  const presence = facultative
    ? [ApiPropertyOptional(documentation), IsOptional()]
    : [ApiProperty(documentation)];
  return applyDecorators(
    ...presence,
    ValidateBy({
      name: 'isIn',
      constraints: [LOCALES_SUPPORTEES],
      validator: {
        validate: estUneLocaleSupportee,
        defaultMessage: buildMessage(
          (prefixe) =>
            `${prefixe}$property must be one of the following values: $constraint1`,
        ),
      },
    }),
  );
}
