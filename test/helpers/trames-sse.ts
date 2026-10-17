export interface EvenementFlux {
  type: string;
  donnees: Record<string, unknown>;
}

const SEPARATEUR_DE_TRAMES = '\n\n';
const PREFIXE_EVENEMENT = 'event: ';
const PREFIXE_DONNEES = 'data: ';

function evenementsDeLaTrame(trame: string): EvenementFlux[] {
  const lignes = trame.split('\n');
  const type = lignes
    .find((ligne) => ligne.startsWith(PREFIXE_EVENEMENT))
    ?.slice(PREFIXE_EVENEMENT.length);
  const donnees = lignes
    .filter((ligne) => ligne.startsWith(PREFIXE_DONNEES))
    .map((ligne) => ligne.slice(PREFIXE_DONNEES.length));
  if (type === undefined || donnees.length === 0) {
    return [];
  }
  return [
    {
      type,
      donnees: JSON.parse(donnees.join('\n')) as Record<string, unknown>,
    },
  ];
}

export function lecteurDeTrames(): (morceau: string) => EvenementFlux[] {
  let reste = '';
  return (morceau) => {
    const trames = `${reste}${morceau}`.split(SEPARATEUR_DE_TRAMES);
    reste = trames.pop() ?? '';
    return trames.flatMap(evenementsDeLaTrame);
  };
}
