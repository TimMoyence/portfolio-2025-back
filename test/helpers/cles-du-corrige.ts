const CLES_DU_CORRIGE: readonly string[] = [
  'solutions',
  'solution',
  'pieges',
  'confusion',
  'confusions',
  'misconception',
  'notes',
  'seuil',
  'remediations',
  'bonne',
  'bonneReponse',
  'corriges',
];

export function clesImbriquees(valeur: unknown): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => clesImbriquees(element));
  }
  if (valeur !== null && typeof valeur === 'object') {
    return Object.entries(valeur).flatMap(([cle, contenu]) => [
      cle,
      ...clesImbriquees(contenu),
    ]);
  }
  return [];
}

export function clesDuCorrigeDans(valeur: unknown): string[] {
  return clesImbriquees(valeur).filter((cle) => CLES_DU_CORRIGE.includes(cle));
}

const CLES_SECRETES_DE_LA_V3: readonly string[] = [
  ...CLES_DU_CORRIGE,
  'guide',
  'correction',
  'interaction',
  'corrige',
  'banque',
  'attendus',
  'fragment',
  'fausse',
  'valeurAttendue',
  'obligatoires',
];

export function clesSecretesDans(valeur: unknown): string[] {
  return clesImbriquees(valeur).filter((cle) =>
    CLES_SECRETES_DE_LA_V3.includes(cle),
  );
}
