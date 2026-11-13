import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import { questionChiffreeDe } from '../b3-03/b3-03.donnees';

export const CLASSEURS_B3_04 = {
  contacts: 'B3-04_contacts.8ad93211.xlsx',
  envoi: 'B3-04_envoi.328d12bc.xlsx',
} as const;

export const ADRESSES_DE_REMPLISSAGE_B3_04 = [
  'votre.adresse@ecole.example',
  'adresse.du.binome@ecole.example',
] as const;

export const QUESTIONS_CHIFFREES_B3_04 = [
  'b3-04-a1-contacts',
  'b3-04-a2-lettres-rennes',
  'b3-04-a2-chere-madame',
] as const;

type QuestionChiffreeB304 = (typeof QUESTIONS_CHIFFREES_B3_04)[number];

export const VALEURS_B3_04 = {
  'b3-04-a1-contacts': 596,
  'b3-04-a2-lettres-rennes': 50,
  'b3-04-a2-chere-madame': 23,
} as const satisfies Readonly<Record<QuestionChiffreeB304, number>>;

export const PIEGES_B3_04 = {
  'b3-04-a1-contacts': { 'ligne-d-en-tete-comptee': 597 },
  'b3-04-a2-lettres-rennes': { 'filtre-sur-le-mauvais-champ': 18 },
  'b3-04-a2-chere-madame': { 'condition-inversee': 27 },
} as const satisfies Readonly<
  Record<QuestionChiffreeB304, Readonly<Partial<Record<ConfusionId, number>>>>
>;

export const PIECES_JOINTES_B3_04 = {
  contacts: {
    publique: `/assets/cours/b3-04/${CLASSEURS_B3_04.contacts}`,
    reservee: `b3-04/${CLASSEURS_B3_04.contacts}`,
  },
  envoi: `b3-04/${CLASSEURS_B3_04.envoi}`,
} as const;

const LIBELLE_DES_CONTACTS = 'Contacts des clients Norvane (Excel)';

export const CONTACTS_A_TELECHARGER = {
  pieceJointe: {
    libelle: LIBELLE_DES_CONTACTS,
    fichier: PIECES_JOINTES_B3_04.contacts.publique,
  },
};

export const CONTACTS_RESERVES = {
  libelle: LIBELLE_DES_CONTACTS,
  classeur: PIECES_JOINTES_B3_04.contacts.reservee,
  reprend: [],
};

export const CLASSEUR_D_ENVOI = {
  libelle: 'Classeur d’envoi à deux lignes (Excel)',
  classeur: PIECES_JOINTES_B3_04.envoi,
  reprend: [],
};

export const questionChiffreeB304 = questionChiffreeDe<QuestionChiffreeB304>(
  VALEURS_B3_04,
  PIEGES_B3_04,
);
