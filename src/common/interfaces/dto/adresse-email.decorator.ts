import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { buildMessage, ValidateBy } from 'class-validator';
import { estUneAdresseEmail } from '../../domain/value-objects/EmailAddress';

export function AdresseEmail(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ type: String, format: 'email' }),
    ValidateBy({
      name: 'isEmail',
      validator: {
        validate: (valeur: unknown) =>
          typeof valeur === 'string' && estUneAdresseEmail(valeur),
        defaultMessage: buildMessage(
          (prefixe) => `${prefixe}$property must be an email`,
        ),
      },
    }),
  );
}
