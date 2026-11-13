import { implique } from '../../../../../../common/domain/logique/implique';
import { exigerAuMoinsUn } from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'proposition',
  'connecteur',
  'negation',
  'quantificateur',
  'tableur',
] as const satisfies readonly ConceptId[];

export const OU_EXCLUSIF = 'ou-lu-exclusif';
export const RECIPROQUE = 'implication-lue-comme-equivalence';
export const PREMISSE_FAUSSE = 'implication-fausse-si-premisse-fausse';
export const BORNE = 'borne-stricte-large';
export const ET_PAR_OU = 'et-traduit-par-ou';
export const OU_COMPTE_DEUX_FOIS = 'ou-compte-deux-fois';
export const SANS_MORGAN = 'negation-sans-morgan';
export const COMPARAISON = 'negation-comparaison';
export const POUR_TOUT_EN_AUCUN = 'negation-pour-tout-en-aucun';
export const IL_EXISTE_GARDE = 'negation-il-existe-gardee';
export const ORDRE = 'ordre-quantificateurs-inverse';

export const RENVOI_AU_FICHIER_DES_CLIENTS = 'B1-05-A3-05-FICHIER-CLIENTS';

export interface Client {
  readonly nom: string;
  readonly fidele: boolean;
  readonly panier: number;
  readonly abonne: boolean;
}

const client = (
  nom: string,
  fidele: boolean,
  panier: number,
  abonne: boolean,
): Client => ({ nom, fidele, panier, abonne });

export const CLIENTS: readonly Client[] = [
  client('Ana', true, 72, false),
  client('Bilal', false, 85, true),
  client('Chloé', true, 50, false),
  client('David', true, 38, true),
  client('Emma', false, 45, false),
  client('Farid', true, 64, true),
  client('Gaël', false, 55, false),
  client('Hugo', true, 49, false),
];

export const COMMANDES_DU_SAMEDI: readonly Client[] = [
  client('Léo', true, 50, false),
  client('Maya', false, 90, false),
  client('Noé', true, 48, true),
  client('Lina', false, 61, true),
  client('Paul', true, 60, false),
  client('Rose', false, 30, false),
];

export const SEUIL_DE_LA_REMISE = 50;
export const SEUIL_DE_LA_LIVRAISON = 60;
export const TAUX_DE_LA_REMISE = 10;
export const FRAIS_DE_PORT = 6;

export const ouiNon = (valeur: boolean): string => (valeur ? 'oui' : 'non');

const compter = (regle: (candidat: Client) => boolean): number =>
  CLIENTS.filter(regle).length;

const remiseAtteinte = (candidat: Client): boolean =>
  candidat.panier >= SEUIL_DE_LA_REMISE;
const livraisonAtteinte = (candidat: Client): boolean =>
  candidat.panier >= SEUIL_DE_LA_LIVRAISON;

export const CONTRE_EXEMPLES = compter(
  (candidat) => !implique(remiseAtteinte(candidat), candidat.fidele),
);
export const NON_FIDELES = compter((candidat) => !candidat.fidele);
export const HORS_EQUIVALENCE = compter(
  (candidat) => remiseAtteinte(candidat) !== candidat.fidele,
);
export const LIVRAISONS_OFFERTES = compter(
  (candidat) => livraisonAtteinte(candidat) || candidat.abonne,
);
export const LIVRAISONS_ADDITIONNEES =
  compter(livraisonAtteinte) + compter((candidat) => candidat.abonne);
export const LIVRAISONS_EXCLUSIVES = compter(
  (candidat) => livraisonAtteinte(candidat) !== candidat.abonne,
);

type PiegeDeCellule = readonly [number, ConfusionId];

const remiseDe = (
  candidat: Client,
  { ou = false, stricte = false } = {},
): number => {
  const panier = stricte
    ? candidat.panier > SEUIL_DE_LA_REMISE
    : remiseAtteinte(candidat);
  const accordee = ou ? candidat.fidele || panier : candidat.fidele && panier;
  return accordee ? (candidat.panier * TAUX_DE_LA_REMISE) / 100 : 0;
};

const aPayerDe = (
  candidat: Client,
  { sansMorgan = false, large = false } = {},
): number => {
  const petit = large
    ? candidat.panier <= SEUIL_DE_LA_LIVRAISON
    : !livraisonAtteinte(candidat);
  const portPaye = sansMorgan
    ? petit || !candidat.abonne
    : petit && !candidat.abonne;
  const net = candidat.panier - remiseDe(candidat);
  return portPaye ? net + FRAIS_DE_PORT : net;
};

const piegesDifferents = (
  juste: number,
  pieges: readonly PiegeDeCellule[],
): PiegeDeCellule[] => pieges.filter(([valeur]) => valeur !== juste);

const piegesDeLaRemise = (candidat: Client): PiegeDeCellule[] =>
  piegesDifferents(remiseDe(candidat), [
    [remiseDe(candidat, { ou: true }), ET_PAR_OU],
    [remiseDe(candidat, { stricte: true }), BORNE],
  ]);

const piegesDuPort = (candidat: Client): PiegeDeCellule[] =>
  piegesDifferents(aPayerDe(candidat), [
    [aPayerDe(candidat, { sansMorgan: true }), SANS_MORGAN],
  ]).filter(([valeur]) => valeur !== aPayerDe(candidat, { large: true }));

const DERNIERE_LIGNE = COMMANDES_DU_SAMEDI.length + 1;

export const FORMULE_DE_LA_REMISE = `=SI(ET(B2="oui";C2>=${SEUIL_DE_LA_REMISE});C2/${100 / TAUX_DE_LA_REMISE};0)`;
export const FORMULE_DU_PORT = `=SI(ET(C2<${SEUIL_DE_LA_LIVRAISON};D2="non");C2-E2+${FRAIS_DE_PORT};C2-E2)`;

const commande = (rang: number): Client => {
  const trouvee = COMMANDES_DU_SAMEDI.at(rang);
  if (trouvee === undefined) {
    throw new RangeError(`aucune commande au rang ${rang}`);
  }
  return trouvee;
};

const CELLULES_DES_CONTROLES = {
  A1: 'Client',
  B1: 'Fidèle',
  C1: 'Panier (€)',
  D1: 'Abonné au club',
  E1: 'Remise (€)',
  F1: 'Net à payer (€)',
  ...colonneDeValeurs(
    'A',
    COMMANDES_DU_SAMEDI.map(({ nom }) => nom),
  ),
  ...colonneDeValeurs(
    'B',
    COMMANDES_DU_SAMEDI.map(({ fidele }) => ouiNon(fidele)),
  ),
  ...colonneDeValeurs(
    'C',
    COMMANDES_DU_SAMEDI.map(({ panier }) => panier),
  ),
  ...colonneDeValeurs(
    'D',
    COMMANDES_DU_SAMEDI.map(({ abonne }) => ouiNon(abonne)),
  ),
};

const valeursDe = (calcul: (candidat: Client) => number) =>
  exigerAuMoinsUn(
    COMMANDES_DU_SAMEDI.map(calcul),
    'la feuille des contrôles attend au moins une commande',
  );

export const FEUILLE_DES_CONTROLES = {
  attendus: exigerAuMoinsUn(
    [
      ...colonneRecopiee(
        {
          colonne: 'E',
          premiereLigne: 2,
          formule: FORMULE_DE_LA_REMISE,
          piegesDuModele: piegesDeLaRemise(commande(0)),
          piegesDuRang: (rang) => piegesDeLaRemise(commande(rang)),
        },
        valeursDe((candidat) => remiseDe(candidat)),
      ),
      ...colonneRecopiee(
        {
          colonne: 'F',
          premiereLigne: 2,
          formule: FORMULE_DU_PORT,
          piegesDuModele: piegesDuPort(commande(0)),
          piegesDuRang: (rang) => piegesDuPort(commande(rang)),
        },
        valeursDe((candidat) => aPayerDe(candidat)),
      ),
    ],
    'la feuille des contrôles attend au moins une cellule',
  ),
  plan: {
    id: 'b1-05-a2-tableur-controles',
    intitule: 'Exercice 3 — Les contrôles des commandes au tableur',
    lignes: DERNIERE_LIGNE,
    colonnes: 6,
    cellules: CELLULES_DES_CONTROLES,
    verrouillees: Object.keys(CELLULES_DES_CONTROLES),
    consignes: [
      'Données fictives Partie Libre : les commandes du samedi de la boutique de Nantes.',
      `En E2, avec SI et ET : une remise de ${TAUX_DE_LA_REMISE} % du panier si le client est fidèle et si son panier atteint ${SEUIL_DE_LA_REMISE} €, 0 sinon.`,
      `En F2, avec SI et ET, sans NON : le net à payer, panier moins la remise, plus ${FRAIS_DE_PORT} € de port si la livraison n’est pas offerte (offerte si le panier atteint ${SEUIL_DE_LA_LIVRAISON} € ou si le client est abonné).`,
      `Recopiez E2 et F2 jusqu’à la ligne ${DERNIERE_LIGNE} : ${gesteDeRecopie(['E2', 'F2'], DERNIERE_LIGNE)}.`,
    ],
  },
};
