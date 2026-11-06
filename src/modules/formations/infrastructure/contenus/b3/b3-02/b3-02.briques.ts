import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import * as moteur from '../../briques';

type SocleDeLaPage = Pick<
  moteur.SocleDEcran,
  'screenId' | 'titre' | 'concepts'
> & { readonly notes: AuMoinsUnModifiable<string> };

export interface PageDeFormules {
  readonly rang: number;
  readonly syntaxe: string;
  readonly arguments: string;
  readonly piege: string;
  readonly exemple: string;
}

interface Infographie {
  readonly id: string;
  readonly fichier: string;
  readonly titre: string;
  readonly imageAlt: string;
}

export const DOSSIER_DES_INFOGRAPHIES = '/assets/cours/b3-02/v1';

export const INFOGRAPHIES: readonly Infographie[] = [
  {
    id: 'M2',
    fichier: 'nettoyer-le-texte.webp',
    titre: 'Nettoyer le texte',
    imageAlt:
      'Infographie : une ville en capitales entourée d’espaces passe par SUPPRESPACE puis NOMPROPRE et devient « Bordeaux ».',
  },
  {
    id: 'M3',
    fichier: 'convertir-un-montant.webp',
    titre: 'Du texte au nombre',
    imageAlt:
      'Infographie : un montant en texte perd son symbole et son espace par deux SUBSTITUE, puis CNUM le rend nombre.',
  },
  {
    id: 'M4',
    fichier: 'signaler-par-si-ou.webp',
    titre: 'Signaler, pas corriger',
    imageAlt:
      'Infographie : trois tests passent dans un entonnoir OU ; un seul vrai suffit pour marquer la ligne « À vérifier ».',
  },
  {
    id: 'M5',
    fichier: 'recherchev-quatre-arguments.webp',
    titre: 'RECHERCHEV en quatre questions',
    imageAlt:
      'Infographie : les quatre arguments de RECHERCHEV numérotés, et la ligne AG06 de la table Agences qui rend « Ouest ».',
  },
  {
    id: 'M6',
    fichier: 'additionner-sous-conditions.webp',
    titre: 'Additionner sous conditions',
    imageAlt:
      'Infographie : SOMME.SI.ENS en couleurs, un entonnoir ne laisse passer que les lignes de Rennes en 2026.',
  },
  {
    id: 'M7',
    fichier: 'jours-ouvres.webp',
    titre: 'Compter en jours ouvrés',
    imageAlt:
      'Infographie : un calendrier de mars 2026, week-end grisé, du vendredi de la commande au lundi de la livraison.',
  },
  {
    id: 'M8',
    fichier: 'calendrier-joursem-datedif-temps.webp',
    titre: 'Lire le calendrier',
    imageAlt:
      'Infographie : une semaine numérotée pour JOURSEM, une frise de mois pour DATEDIF, une horloge pour TEMPS.',
  },
  {
    id: 'M9',
    fichier: 'moyenne-ou-mediane.webp',
    titre: 'Moyenne ou médiane ?',
    imageAlt:
      'Infographie : cinq colis dont un délai de 40 jours ; la balance de la moyenne penche, la médiane reste au milieu.',
  },
  {
    id: 'M10',
    fichier: 'tableau-structure.webp',
    titre: 'Un tableau qui grandit',
    imageAlt:
      'Infographie : une plage fixe laisse dehors les lignes collées dessous ; le tableau T_Commandes s’étire pour les prendre.',
  },
  {
    id: 'M11',
    fichier: 'tcd-quatre-zones.webp',
    titre: 'Le TCD en quatre zones',
    imageAlt:
      'Infographie : les quatre zones du volet des champs et un TCD dont la ligne Rennes fait 100 %.',
  },
  {
    id: 'M12',
    fichier: 'graphique-qui-repond.webp',
    titre: 'D’abord la question',
    imageAlt:
      'Infographie : six vignettes associent une question à son graphique ; deux barres, l’axe coupé puis l’axe depuis zéro.',
  },
  {
    id: 'M13',
    fichier: 'ratios-de-sommes.webp',
    titre: 'Un taux, c’est un ratio de sommes',
    imageAlt:
      'Infographie : deux ventes ; le ratio des sommes donne 32,7 %, la moyenne des taux 45 %, barrée.',
  },
  {
    id: 'M14',
    fichier: 'tableau-de-bord.webp',
    titre: 'Lu en trente secondes',
    imageAlt:
      'Infographie : une page de tableau de bord, quatre indicateurs comparés, deux graphiques, un segment relié, des taux en rouge.',
  },
];

export const PAGES_DE_FORMULES = INFOGRAPHIES.length;
const DUREE_D_UNE_PAGE = 2;

function infographieDeLaPage(rang: number): Infographie {
  const infographie = INFOGRAPHIES.at(rang - 1);
  if (infographie === undefined) {
    throw new Error(`aucune infographie pour la page ${rang}`);
  }
  return infographie;
}

export function pageDeFormules(
  { notes, ...socle }: SocleDeLaPage,
  page: PageDeFormules,
): moteur.EcranDeRecit {
  return moteur.ecranDImageCommentee(
    socle,
    DOSSIER_DES_INFOGRAPHIES,
    infographieDeLaPage(page.rang),
    {
      sousTitre: `Formules pas à pas · page ${page.rang} sur ${PAGES_DE_FORMULES}`,
      paragraphes: [
        `Syntaxe : ${page.syntaxe}`,
        `Arguments : ${page.arguments}`,
        `Le piège : ${page.piege}`,
        `Exemple : ${page.exemple}`,
      ],
      dureeMinutes: DUREE_D_UNE_PAGE,
    },
    notes,
  );
}

type SocleDuVote = Pick<
  moteur.SocleDEcran,
  'screenId' | 'titre' | 'dureeMinutes' | 'concepts' | 'notes'
>;

export interface PieceReservee {
  readonly libelle: string;
  readonly classeur: string;
  readonly reprend: string[];
}

export function voteQuiOuvre(
  socle: SocleDuVote,
  question: moteur.VoteDuCours,
  pieceJointe?: PieceReservee,
): moteur.Acte[number] {
  return {
    ...socle,
    diffusion: 'seance',
    brique: 'fp-vote',
    proprietes: {
      modalite: 'solo',
      ...(pieceJointe === undefined ? {} : { pieceJointe }),
      questions: [question],
    },
  };
}

export const MEDIAS_DES_INFOGRAPHIES = (
  ...gravures: Parameters<typeof moteur.mediasDesIllustrations>[2][]
) =>
  moteur.mediasDesIllustrations(
    DOSSIER_DES_INFOGRAPHIES,
    INFOGRAPHIES.map(({ id, fichier, titre }) => [id, fichier, titre] as const),
    ...gravures,
  );
