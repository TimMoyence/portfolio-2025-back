import { buildMessage, ValidateBy } from 'class-validator';
import { estUneAdresseEmail } from '../../domain/value-objects/EmailAddress';

export function AdresseEmail(): PropertyDecorator {
  return ValidateBy({
    name: 'isEmail',
    validator: {
      validate: (valeur: unknown) =>
        typeof valeur === 'string' && estUneAdresseEmail(valeur),
      defaultMessage: buildMessage(
        (prefixe) => `${prefixe}$property must be an email`,
      ),
    },
  });
}
