# B2-01 · preuve de contrôle navigateur

Contrôle effectué sur le serveur Angular local avec l’API de formation locale et des réponses de
session simulées dans le navigateur pour isoler les rôles étudiant et formateur.

## Parcours public

- 52 écrans montés depuis le catalogue publié, version technique 1 ;
- titre public, niveau BTS CG 2 et durée présents ;
- médias pédagogiques chargés après défilement de tous les écrans ;
- aucune image cassée après chargement différé ;
- aucune barre de défilement horizontale à 1280 px ni à 390 px ;
- ressources Excel/Calc, Insee, bachelor et M1 accessibles ;
- réponses et corrections non exposées dans le parcours public.

## Rôle étudiant

- 9 scénarios Playwright passés : rattachement, profil téléphone, attente de démarrage,
  reprise après coupure, flux refusé, réponse et renouvellement de session ;
- contrôle navigateur du formulaire de rattachement et du premier écran interactif ;
- persistance et restauration du brouillon vérifiées par les scénarios de reprise.

## Rôle formateur

- 3 scénarios Playwright passés : guide, annotations/groupes/export et statistiques ;
- pupitre local contrôlé avec statistiques, question problématique, guide et pilotage ;
- règle de notation accessible par focus sur l’aide dédiée ;
- correction test actualisée pour l’interface accessible actuelle.

## Limite explicitement conservée

La signature pédagogique d’un enseignant et l’observation de vrais étudiants restent des
validations humaines externes. Le contrôle navigateur des rôles étudiant et formateur est,
lui, exécuté et documenté ici.
