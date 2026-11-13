import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import {
  BORNE,
  COMPARAISON,
  CONCEPTS_DU_COURS,
  ET_PAR_OU,
  IL_EXISTE_GARDE,
  ORDRE,
  OU_COMPTE_DEUX_FOIS,
  OU_EXCLUSIF,
  POUR_TOUT_EN_AUCUN,
  PREMISSE_FAUSSE,
  RECIPROQUE,
  SANS_MORGAN,
} from './b1-05.donnees';
import * as moteur from '../../briques';

const QUESTIONS_DU_RAPPEL: AuMoinsUnModifiable<moteur.VoteDuCours> = [
  moteur.rappel(
    'b1-05-r-et',
    'connecteur',
    'P vraie, Q fausse. Que vaut « P et Q » ?',
    'Fausse : « et » exige les deux',
    [['Vraie : une des deux suffit', ET_PAR_OU]],
  ),
  moteur.rappel(
    'b1-05-r-ou',
    'connecteur',
    'P vraie, Q vraie. Que vaut « P ou Q » ?',
    'Vraie : « ou » accepte les deux',
    [['Fausse : « ou » veut une seule des deux', OU_EXCLUSIF]],
  ),
  moteur.rappel(
    'b1-05-r-compter-ou',
    'connecteur',
    '15 fidèles, 9 abonnés, dont 5 à la fois. Combien sont fidèles ou abonnés ?',
    '19 : 15 + 9 − 5',
    [['24 : 15 + 9', OU_COMPTE_DEUX_FOIS]],
  ),
  moteur.rappel(
    'b1-05-r-premisse',
    'connecteur',
    'P fausse, Q fausse. Que vaut « si P alors Q » ?',
    'Vraie : seule « P vraie et Q fausse » la rend fausse',
    [['Fausse : P est fausse', PREMISSE_FAUSSE]],
  ),
  moteur.rappel(
    'b1-05-r-reciproque',
    'connecteur',
    '« S’il pleut, le sol est mouillé. » Le sol est mouillé : pleut-il ?',
    'Pas forcément : la réciproque n’est pas affirmée',
    [['Oui, forcément', RECIPROQUE]],
  ),
  moteur.rappel(
    'b1-05-r-borne',
    'proposition',
    '« Panier ≥ 50 € » : un panier de 50 € pile la vérifie-t-il ?',
    'Oui : ≥ inclut 50',
    [['Non : il faut dépasser 50', BORNE]],
  ),
  moteur.rappel(
    'b1-05-r-morgan-et',
    'negation',
    'Quel est le contraire de « fidèle et abonné » ?',
    '« Non fidèle ou non abonné »',
    [['« Non fidèle et non abonné »', SANS_MORGAN]],
  ),
  moteur.rappel(
    'b1-05-r-morgan-ou',
    'negation',
    'NON(OU(X;Y)) équivaut à :',
    'ET(NON(X);NON(Y))',
    [['OU(NON(X);NON(Y))', SANS_MORGAN]],
  ),
  moteur.rappel(
    'b1-05-r-comparaison',
    'negation',
    'Quel est le contraire de « x < 21 » ?',
    '« x ≥ 21 »',
    [['« x > 21 »', COMPARAISON]],
  ),
  moteur.rappel(
    'b1-05-r-pour-tout',
    'quantificateur',
    'Quel est le contraire de « toutes les tables sont réservées » ?',
    '« Au moins une table n’est pas réservée »',
    [['« Aucune table n’est réservée »', POUR_TOUT_EN_AUCUN]],
  ),
  moteur.rappel(
    'b1-05-r-il-existe',
    'quantificateur',
    'Quel est le contraire de « il existe une facture impayée » ?',
    '« Toutes les factures sont payées »',
    [['« Il existe une facture payée »', IL_EXISTE_GARDE]],
  ),
  moteur.rappel(
    'b1-05-r-ordre',
    'quantificateur',
    '« Chaque élève a un tuteur » et « un tuteur suit chaque élève » : même sens ?',
    'Non : la seconde affirme un tuteur unique pour tous',
    [['Oui : ce sont les mêmes mots', ORDRE]],
  ),
];

export const ACTE_4: moteur.Acte = [
  moteur.rappelDeToutLeCours(
    {
      screenId: 'B1-05-A4-01-RAPPEL',
      concepts: [...CONCEPTS_DU_COURS],
    },
    'b1-05-a4-rappel',
    QUESTIONS_DU_RAPPEL,
  ),
  moteur.ficheMemo(
    {
      screenId: 'B1-05-A4-02-FICHE-MEMO',
      titre: 'Fiche mémo : conditions et contrôles',
      concepts: [...CONCEPTS_DU_COURS],
    },
    [
      {
        title: 'Et, ou, non',
        description: 'Deux conditions ?',
        back: '« P et Q » : vraie si les deux le sont. « P ou Q » : vraie si au moins une l’est, les deux comprises. « non P » : le contraire.',
      },
      {
        title: 'Si P alors Q',
        description: 'Quand est-elle fausse ?',
        back: 'Seulement si P est vraie et Q fausse. Si P est fausse, l’implication est vraie.',
      },
      {
        title: 'Équivalence',
        description: 'P si et seulement si Q ?',
        back: 'Vraie quand P et Q ont la même valeur. Une implication n’affirme pas sa réciproque.',
      },
      {
        title: 'Lois de Morgan',
        description: 'Nier deux conditions ?',
        back: 'non (P et Q) = non P ou non Q ; non (P ou Q) = non P et non Q. On nie chaque condition et on échange le connecteur.',
      },
      {
        title: 'Nier une comparaison',
        description: 'La borne ?',
        back: 'Le contraire de x ≥ a est x < a ; celui de x > a est x ≤ a. La borne change de camp.',
      },
      {
        title: 'Prédicat',
        description: 'Une phrase à trou ?',
        back: 'P(x) devient vraie ou fausse quand on remplace x. Sa négation : non P(x), pour la même valeur de x.',
      },
      {
        title: 'Pour tout, il existe',
        description: 'Le contraire ?',
        back: 'Non (pour tout x, P(x)) : il existe x tel que non P(x). Non (il existe x, P(x)) : pour tout x, non P(x).',
      },
      {
        title: 'L’ordre compte',
        description: 'Pour tout… il existe… ?',
        back: '« Pour tout x, il existe y » laisse y dépendre de x ; « il existe y pour tout x » exige un y commun.',
      },
      {
        title: 'Au tableur',
        description: 'Une règle en formule ?',
        back: '=SI(ET(B2="oui";C2>=50);"remise";"sans remise"). Textes entre guillemets, NON(OU(A;B)) = ET(NON(A);NON(B)).',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
];
