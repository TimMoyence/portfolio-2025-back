import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';

export class MotDePasseActuelIncorrectError extends InvalidInputError {
  constructor() {
    super('Current password is invalid');
  }
}
