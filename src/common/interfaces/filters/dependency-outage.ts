const CODES_RESEAU = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETDOWN',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
]);

const CODES_POSTGRES = new Set(['53300', '57P01', '57P02', '57P03']);

const PREFIXE_SQLSTATE_CONNEXION = '08';

const SIGNATURES_MESSAGE = [
  'connection terminated',
  'connection is not established',
  'client has encountered a connection error',
  'terminating connection',
  'the database system is',
  'timeout exceeded when trying to connect',
];

const PROFONDEUR_MAX = 5;

export const MESSAGE_DEPENDANCE_INJOIGNABLE =
  "La base de données ne répond pas pour l'instant : les données déjà enregistrées sont intactes. Patientez quelques secondes, puis renvoyez la même demande.";

function codeDe(erreur: object): string | undefined {
  const code = (erreur as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function estCodeDeCoupure(code: string | undefined): boolean {
  if (code === undefined) {
    return false;
  }
  return (
    CODES_RESEAU.has(code) ||
    CODES_POSTGRES.has(code) ||
    code.startsWith(PREFIXE_SQLSTATE_CONNEXION)
  );
}

function estMessageDeCoupure(erreur: object): boolean {
  const message = (erreur as { message?: unknown }).message;
  if (typeof message !== 'string') {
    return false;
  }
  const normalise = message.toLowerCase();
  return SIGNATURES_MESSAGE.some((signature) => normalise.includes(signature));
}

function causesDe(erreur: object): unknown[] {
  const porteur = erreur as { driverError?: unknown; cause?: unknown };
  return [porteur.driverError, porteur.cause];
}

export function estDependanceInjoignable(
  erreur: unknown,
  profondeur = 0,
): boolean {
  if (
    erreur === null ||
    typeof erreur !== 'object' ||
    profondeur >= PROFONDEUR_MAX
  ) {
    return false;
  }
  if (estCodeDeCoupure(codeDe(erreur)) || estMessageDeCoupure(erreur)) {
    return true;
  }
  return causesDe(erreur).some((cause) =>
    estDependanceInjoignable(cause, profondeur + 1),
  );
}
