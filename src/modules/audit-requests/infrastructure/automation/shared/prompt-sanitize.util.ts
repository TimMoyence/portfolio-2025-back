const MAX_PROMPT_INPUT_LENGTH = 500;

/**
 * Sanitise une chaine fournie par l'utilisateur avant injection dans un prompt LLM.
 *
 * - Remplace les sauts de ligne par des espaces (empeche l'injection de fausses instructions)
 * - Tronque a {@link MAX_PROMPT_INPUT_LENGTH} caracteres
 * - Supprime les espaces superflus
 */
export function sanitizePromptInput(
  input: string,
  maxLength = MAX_PROMPT_INPUT_LENGTH,
): string {
  return input
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}
