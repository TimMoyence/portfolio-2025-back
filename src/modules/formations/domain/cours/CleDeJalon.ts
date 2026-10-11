import { signerAvecLeSecret } from '../../../../common/domain/crypto/secret-hmac';

const SECRET_DES_JALONS = 'FORMATIONS_PULSE_SECRET';
const CONTEXTE = 'jalon';

export function cleDeJalon(sessionId: string, participantId: string): string {
  return signerAvecLeSecret(
    SECRET_DES_JALONS,
    `${CONTEXTE}:${sessionId}:${participantId}`,
  );
}
