export type Categorie =
  | 'Mobilier'
  | 'Informatique'
  | 'Fournitures'
  | 'Maintenance';

export interface ParametresDeCategorie {
  readonly categorie: Categorie;
  readonly partDuBudget: number;
  readonly tauxDeMarge: number;
  readonly quantites: readonly (readonly [number, number])[];
}

export const CATEGORIES: readonly ParametresDeCategorie[] = [
  {
    categorie: 'Mobilier',
    partDuBudget: 0.4,
    tauxDeMarge: 0.38,
    quantites: [
      [1, 25],
      [2, 22],
      [3, 15],
      [4, 12],
      [5, 10],
      [6, 8],
      [7, 5],
      [8, 3],
    ],
  },
  {
    categorie: 'Informatique',
    partDuBudget: 0.38,
    tauxDeMarge: 0.22,
    quantites: [
      [1, 30],
      [2, 25],
      [3, 18],
      [4, 12],
      [5, 9],
      [6, 6],
    ],
  },
  {
    categorie: 'Fournitures',
    partDuBudget: 0.11,
    tauxDeMarge: 0.45,
    quantites: [
      [5, 20],
      [10, 30],
      [15, 20],
      [20, 15],
      [25, 10],
      [30, 5],
    ],
  },
  {
    categorie: 'Maintenance',
    partDuBudget: 0.11,
    tauxDeMarge: 0.55,
    quantites: [
      [1, 50],
      [2, 30],
      [3, 15],
      [4, 5],
    ],
  },
];

export interface ProduitDeCatalogue {
  readonly id: string;
  readonly libelle: string;
  readonly categorie: Categorie;
  readonly prix: number;
}

const LIBELLES_ET_PRIX: Readonly<
  Record<Categorie, readonly (readonly [string, number])[]>
> = {
  Mobilier: [
    ['Bureau droit 140 cm', 289],
    ['Bureau réglable en hauteur', 649],
    ['Fauteuil ergonomique', 359],
    ['Chaise visiteur', 79],
    ['Table de réunion 8 places', 890],
    ['Armoire haute à portes', 420],
    ['Caisson mobile 3 tiroirs', 165],
    ['Étagère métallique', 129],
    ['Cloison acoustique', 245],
    ['Banque d’accueil', 1150],
    ['Vestiaire 2 portes', 310],
    ['Lampe de bureau LED', 49],
  ],
  Informatique: [
    ['Ordinateur portable 14 pouces', 1090],
    ['Ordinateur portable 16 pouces', 1390],
    ['Unité centrale bureautique', 790],
    ['Écran 24 pouces', 179],
    ['Écran 27 pouces', 289],
    ['Station d’accueil USB-C', 219],
    ['Imprimante multifonction', 649],
    ['Vidéoprojecteur', 790],
    ['Clavier et souris sans fil', 69],
    ['Casque à réduction de bruit', 149],
    ['Disque dur externe 2 To', 99],
    ['Borne Wi-Fi professionnelle', 340],
  ],
  Fournitures: [
    ['Ramettes papier A4 (carton de 5)', 27.5],
    ['Stylos à bille (boîte de 50)', 14.9],
    ['Classeurs à levier (lot de 10)', 32],
    ['Cartouche d’encre noire', 39.9],
    ['Toner laser', 89],
    ['Blocs-notes A5 (lot de 20)', 18.5],
    ['Enveloppes C4 (boîte de 250)', 34],
    ['Agrafeuse et agrafes', 22.9],
    ['Notes repositionnables (lot de 12)', 16.8],
    ['Rouleaux d’étiquettes', 24.5],
  ],
  Maintenance: [
    ['Installation de poste de travail', 120],
    ['Intervention sur site (demi-journée)', 290],
    ['Contrat de maintenance annuel', 1200],
    ['Formation utilisateur (journée)', 650],
    ['Montage de mobilier (heure)', 55],
    ['Reprise et recyclage du matériel', 180],
  ],
};

export const PRODUITS: readonly ProduitDeCatalogue[] = CATEGORIES.flatMap(
  ({ categorie }) =>
    LIBELLES_ET_PRIX[categorie].map(([libelle, prix]) => ({
      libelle,
      categorie,
      prix,
    })),
).map((produit, rang) => ({
  id: `P${String(rang + 1).padStart(3, '0')}`,
  ...produit,
}));

export const PRODUITS_ABSENTS = ['P047', 'P051'] as const;

export interface AgenceDuReseau {
  readonly id: string;
  readonly ville: string;
  readonly region: string;
  readonly responsable: string;
  readonly villesDesClients: readonly [string, ...string[]];
  readonly poids: number;
  readonly croissance2026: number;
}

export const AGENCES: readonly AgenceDuReseau[] = [
  {
    id: 'AG01',
    ville: 'Lille',
    region: 'Nord',
    responsable: 'Claire Vasseur',
    villesDesClients: ['Lille', 'Roubaix', 'Tourcoing', 'Douai'],
    poids: 1,
    croissance2026: 1.25,
  },
  {
    id: 'AG02',
    ville: 'Rouen',
    region: 'Nord',
    responsable: 'Julien Lemoine',
    villesDesClients: ['Rouen', 'Le Havre', 'Évreux', 'Dieppe'],
    poids: 0.8,
    croissance2026: 0.98,
  },
  {
    id: 'AG03',
    ville: 'Paris-Est',
    region: 'Île-de-France',
    responsable: 'Sonia Haddad',
    villesDesClients: ['Paris', 'Montreuil', 'Vincennes', 'Créteil'],
    poids: 1.3,
    croissance2026: 1.11,
  },
  {
    id: 'AG04',
    ville: 'Paris-Ouest',
    region: 'Île-de-France',
    responsable: 'Marc Delaunay',
    villesDesClients: [
      'Nanterre',
      'Boulogne-Billancourt',
      'Versailles',
      'Courbevoie',
    ],
    poids: 1.25,
    croissance2026: 1.12,
  },
  {
    id: 'AG05',
    ville: 'Nantes',
    region: 'Ouest',
    responsable: 'Élodie Brunet',
    villesDesClients: ['Nantes', 'Saint-Nazaire', 'Angers', 'Cholet'],
    poids: 0.95,
    croissance2026: 1.11,
  },
  {
    id: 'AG06',
    ville: 'Rennes',
    region: 'Ouest',
    responsable: 'Yann Le Goff',
    villesDesClients: ['Rennes', 'Saint-Malo', 'Vannes', 'Fougères'],
    poids: 0.82,
    croissance2026: 1,
  },
  {
    id: 'AG07',
    ville: 'Bordeaux',
    region: 'Sud-Ouest',
    responsable: 'Inès Lacaze',
    villesDesClients: ['Bordeaux', 'Mérignac', 'Pessac', 'Libourne'],
    poids: 1,
    croissance2026: 1.12,
  },
  {
    id: 'AG08',
    ville: 'Toulouse',
    region: 'Sud-Ouest',
    responsable: 'Thomas Ribeiro',
    villesDesClients: ['Toulouse', 'Blagnac', 'Colomiers', 'Montauban'],
    poids: 0.95,
    croissance2026: 1.11,
  },
  {
    id: 'AG09',
    ville: 'Marseille',
    region: 'Méditerranée',
    responsable: 'Karim Benali',
    villesDesClients: ['Marseille', 'Aubagne', 'Toulon', 'Martigues'],
    poids: 1,
    croissance2026: 1.2,
  },
  {
    id: 'AG10',
    ville: 'Montpellier',
    region: 'Méditerranée',
    responsable: 'Laure Fabre',
    villesDesClients: ['Montpellier', 'Nîmes', 'Béziers', 'Sète'],
    poids: 0.8,
    croissance2026: 1.12,
  },
  {
    id: 'AG11',
    ville: 'Lyon',
    region: 'Est',
    responsable: 'Nicolas Perret',
    villesDesClients: ['Lyon', 'Villeurbanne', 'Vénissieux', 'Saint-Étienne'],
    poids: 1.2,
    croissance2026: 1.11,
  },
  {
    id: 'AG12',
    ville: 'Strasbourg',
    region: 'Est',
    responsable: 'Anne Schmitt',
    villesDesClients: ['Strasbourg', 'Colmar', 'Mulhouse', 'Haguenau'],
    poids: 0.85,
    croissance2026: 0.99,
  },
];

export const NOMS_DE_FAMILLE = [
  'Martin',
  'Bernard',
  'Thomas',
  'Petit',
  'Robert',
  'Richard',
  'Durand',
  'Leroy',
  'Moreau',
  'Simon',
  'Laurent',
  'Lefebvre',
  'Michel',
  'Garcia',
  'David',
  'Bertrand',
  'Roux',
  'Vincent',
  'Fournier',
  'Morel',
  'Girard',
  'André',
  'Mercier',
  'Blanc',
  'Guérin',
  'Boyer',
  'Garnier',
  'Chevalier',
  'François',
  'Legrand',
  'Gauthier',
  'Perrin',
  'Robin',
  'Clément',
  'Morin',
  'Nicolas',
  'Henry',
  'Roussel',
  'Mathieu',
  'Masson',
  'Marchand',
  'Duval',
  'Denis',
  'Lemaire',
  'Dumont',
  'Fontaine',
  'Rousseau',
  'Barbier',
  'Lambert',
] as const;

export const ACTIVITES: Readonly<Record<string, string>> = {
  Conseil: 'Services',
  Bâtiment: 'BTP',
  Logistique: 'Transport',
  Santé: 'Santé',
  Distribution: 'Commerce',
  Ingénierie: 'Industrie',
  Immobilier: 'Services',
  Transports: 'Transport',
  Industrie: 'Industrie',
  Services: 'Services',
  Événements: 'Services',
  Architecture: 'BTP',
  Assurances: 'Services',
};

export const DUPONT_DE_BORDEAUX = [
  { raisonSociale: 'Dupont Bureautique', secteur: 'Commerce' },
  { raisonSociale: 'Dupont & Fils', secteur: 'BTP' },
] as const;

export const COMMERCIAL_DES_REMISES = 'C26';

export const SAISONNALITE = [
  0.92, 0.95, 1.05, 1, 0.96, 1.04, 0.88, 0.62, 1.08, 1.06, 1.1, 1.22,
] as const;

export const REMISES_DU_RESEAU: readonly (readonly [number, number])[] = [
  [0, 50],
  [0.02, 15],
  [0.05, 20],
  [0.08, 10],
  [0.1, 5],
];

export const REMISES_DU_COMMERCIAL: readonly [number, ...number[]] = [
  0.18, 0.2, 0.22, 0.25, 0.28, 0.3,
];

export const DELAIS_DU_RESEAU: readonly (readonly [number, number])[] = [
  [1, 20],
  [2, 30],
  [3, 25],
  [4, 15],
  [5, 10],
];

export const TAILLES_DE_COMMANDE: readonly (readonly [number, number])[] = [
  [1, 20],
  [2, 25],
  [3, 25],
  [4, 18],
  [5, 12],
];

export const MOTIFS_DE_QUARANTAINE = {
  H1: 'Produit absent du référentiel',
  H2: 'Livraison antérieure à la commande',
  H3: 'Commercial non renseigné',
  S1: 'Date au format inconnu',
  S2: 'Quantité négative',
  S3: 'Prix unitaire dix fois le prix catalogue',
} as const;
