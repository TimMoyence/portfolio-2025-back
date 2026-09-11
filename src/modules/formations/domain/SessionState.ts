export const SESSION_STATES = ['attente', 'en_cours', 'terminee'] as const;

export type SessionState = (typeof SESSION_STATES)[number];

const ALLOWED_TRANSITIONS: Readonly<
  Record<SessionState, readonly SessionState[]>
> = {
  attente: ['en_cours', 'terminee'],
  en_cours: ['terminee'],
  terminee: [],
};

export function canTransition(from: SessionState, to: SessionState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
