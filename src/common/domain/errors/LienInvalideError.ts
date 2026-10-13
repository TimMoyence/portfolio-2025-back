import { ResourceNotFoundError } from './ResourceNotFoundError';

export const MESSAGE_DE_LIEN_INVALIDE = 'Lien invalide ou expiré.';

export class LienInvalideError extends ResourceNotFoundError {
  constructor() {
    super(MESSAGE_DE_LIEN_INVALIDE);
  }
}
