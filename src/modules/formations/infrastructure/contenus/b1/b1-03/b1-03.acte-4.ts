import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import { MARQUE_POUR_MARGE, MOYENNE_SIMPLE } from '../b1-01/b1-01.donnees';
import {
  BOITE_EFFECTIF,
  CENTRE_OUBLIE,
  CONCEPTS_DU_COURS,
  ECHANTILLON,
  MEDIANE_PAIRE,
  MEME_MOYENNE,
  MOITIE_DE_MEDIANE,
  RANG_PAR_DEFAUT,
  SANS_TRI,
  SYNTHESE_ERRONEE,
} from './b1-03.donnees';
import * as moteur from '../../briques';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b1-03-r-lignes',
    'tableau-croise-dynamique',
    'Pour le chiffre d’affaires de chaque boutique, comment remplir le TCD ?',
    'Boutique en Lignes, CA_HT en Valeurs',
    [['CA_HT en Lignes, Boutique en Valeurs', SYNTHESE_ERRONEE]],
  ),
  moteur.rappel(
    'b1-03-r-somme',
    'tableau-croise-dynamique',
    'Dans Valeurs, le TCD affiche « Nombre de CA_HT ». Que faire ?',
    'Passer le champ en Somme pour additionner les montants',
    [['Rien : c’est le chiffre d’affaires', SYNTHESE_ERRONEE]],
  ),
  moteur.rappel(
    'b1-03-r-marge',
    'pourcentage',
    'CA HT 600 €, coût d’achat HT 400 €. Quel est le taux de marge ?',
    '200 ÷ 400 = 50 %',
    [['200 ÷ 600 ≈ 33,3 %', MARQUE_POUR_MARGE]],
  ),
  moteur.rappel(
    'b1-03-r-champ',
    'moyenne-ponderee',
    'Deux canaux : 50 % de marge sur 1 000 € de coût, 10 % sur 100 € de coût. Quel est le taux du total ?',
    '(500 + 10) ÷ 1 100 ≈ 46,4 %',
    [['(50 % + 10 %) ÷ 2 = 30 %', MOYENNE_SIMPLE]],
  ),
  moteur.rappel(
    'b1-03-r-mediane-impaire',
    'mediane',
    'Quelle est la médiane de 4, 9, 7, 1, 5 ?',
    'Rangés 1, 4, 5, 7, 9 : la médiane vaut 5',
    [['7, au milieu de la liste', SANS_TRI]],
  ),
  moteur.rappel(
    'b1-03-r-mediane-paire',
    'mediane',
    'Quelle est la médiane de 2, 4, 6, 10 ?',
    '(4 + 6) ÷ 2 = 5',
    [['4, la valeur de rang 2', MEDIANE_PAIRE]],
  ),
  moteur.rappel(
    'b1-03-r-rang',
    'quartiles',
    'Une série rangée compte 10 valeurs. Quel est le rang de Q₁ ?',
    '10 ÷ 4 = 2,5, arrondi au-dessus : rang 3',
    [['10 ÷ 4 = 2,5, arrondi au-dessous : rang 2', RANG_PAR_DEFAUT]],
  ),
  moteur.rappel(
    'b1-03-r-quartile',
    'tableur',
    'Quelle formule donne Q₃ des valeurs de B2:B22 ?',
    '=QUARTILE(B2:B22;3)',
    [['=MEDIANE(B2:B22)*1,5', MOITIE_DE_MEDIANE]],
  ),
  moteur.rappel(
    'b1-03-r-ecart-type',
    'ecart-type',
    'Toutes les ventes de la semaine, sans exception, sont en B2:B22. Quelle formule donne leur écart type ?',
    '=ECARTYPEP(B2:B22), sur toute la population',
    [['=ECARTYPE(B2:B22)', ECHANTILLON]],
  ),
  moteur.rappel(
    'b1-03-r-boite',
    'boite-a-moustaches',
    'Une boîte va de Q₁ = 20 à Q₃ = 50. Quelle part des valeurs contient-elle ?',
    'La moitié, de Q₁ à Q₃',
    [['Un quart, puisque c’est une seule partie', BOITE_EFFECTIF]],
  ),
  moteur.rappel(
    'b1-03-r-comparer',
    'dispersion',
    'Deux boîtes ont la même médiane ; la boîte A est deux fois plus courte. Que conclure ?',
    'A est plus régulière : sa moitié centrale est plus serrée',
    [['Les deux séries se ressemblent : même médiane', MEME_MOYENNE]],
  ),
  moteur.rappel(
    'b1-03-r-classes',
    'moyenne',
    'La classe [10 ; 30[ compte 5 valeurs. Quelle valeur la représente dans une moyenne approchée ?',
    'Son centre, (10 + 30) ÷ 2 = 20',
    [['Sa borne de début, 10', CENTRE_OUBLIE]],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B1-03-A4-01-RAPPEL',
      concepts: [...CONCEPTS_DU_COURS],
    },
    'b1-03-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B1-03-A4-02-FICHE-MEMO',
      titre: 'Fiche mémo : TCD et série à une variable',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Tableau croisé dynamique',
        description: 'Regrouper un fichier ?',
        back: 'Le champ des groupes en Lignes, le montant en Valeurs, en Somme. Contrôle : le total général.',
      },
      {
        title: 'Champ calculé',
        description: 'Un taux dans le TCD ?',
        back: '=(CA_HT-Cout_achat_HT)/Cout_achat_HT, calculé sur les sommes. Jamais la moyenne des taux.',
      },
      {
        title: 'Marge ou marque',
        description: 'Diviser par quoi ?',
        back: 'Taux de marge : marge ÷ coût d’achat HT. Taux de marque : marge ÷ CA HT.',
      },
      {
        title: 'Médiane',
        description: 'Le milieu d’une série ?',
        back: 'Ranger. n impair : rang (n + 1) ÷ 2 ; n pair : demi-somme des deux valeurs du milieu.',
      },
      {
        title: 'Quartiles',
        description: 'Couper en quatre ?',
        back: 'Rangs n ÷ 4 et 3n ÷ 4, arrondis au-dessus. Tableur : QUARTILE(plage;1) et QUARTILE(plage;3).',
      },
      {
        title: 'Écart type',
        description: 'Régulière ou non ?',
        back: 'σ dans l’unité de la série, par ECARTYPEP(plage). Petit σ : série régulière.',
      },
      {
        title: 'Boîte à moustaches',
        description: 'Comparer deux séries ?',
        back: 'min, Q₁, Me, Q₃, max. Chaque part contient un quart des valeurs, quelle que soit sa longueur.',
      },
      {
        title: 'Classes',
        description: 'Un grand fichier ?',
        back: 'Centre = (a + b) ÷ 2 ; moyenne approchée = somme des n × c, divisée par N.',
      },
      {
        title: 'Choisir un résumé',
        description: 'Une valeur extrême ?',
        back: 'Médiane et écart interquartile ; sans valeur extrême, moyenne et écart type.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
