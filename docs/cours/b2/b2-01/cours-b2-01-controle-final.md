# B2-01 · BTS CG 2 — checklist de contrôle final

Cette checklist contrôle le premier cours de mathématiques de BTS CG 2 avant lundi. Le produit
ne conserve qu’un cours B2-01 en version technique 1 : la migration remplace puis republie.

## Contrat pédagogique

- [x] Public : BTS Comptabilité et gestion, 2e année, premier cours de mathématiques.
- [x] Prérequis de première année et diagnostic de reprise identifiés.
- [x] Socle BTS séparé des extensions bachelor/M1 facultatives.
- [x] Périmètre limité au traitement de l’information chiffrée, sans prétendre couvrir seul E3.
- [x] Durée cible de 210 minutes, six actes, transfert final.
- [x] Situation blanche E3 de 55 minutes identifiée comme livrable séparé du premier cours.

## Progression et niveau

- [x] Chaque acte comporte un objectif observable et une production ou décision.
- [x] Moyenne pondérée placée avant le paradoxe du taux global.
- [x] Evolutions, réciproques, indices et taux moyens contrôlés par calcul inverse.
- [x] Tableur, TCD, contrôle de cohérence et reproductibilité travaillés.
- [x] Données nouvelles, correction d’erreur d’IA et recommandation structurée présentes.
- [x] Ecrans denses et charge cognitive contrôlés sur desktop et téléphone ; les ajustements humains restent observables en séance.
- [x] Grille de correction autonome alignée sur les six compétences E3 jointe à la livraison.

## Exactitude et confidentialité

- [x] Bases, signes, unités, dates, arrondis et périmètres vérifiés.
- [x] Taux de marge, taux de marque, marge brute et taux global pondéré distingués.
- [x] Indice fourni lu/reconstitué sans présenter une construction de l’IPC officiel.
- [x] Données fictives Atelier Rivage distinguées des données sourcées.
- [x] Réponses, corrections et remédiations futures non divulguées avant révélation.

## Migration et données servies

- [x] Source unique `B2_COURS`, version technique 1.
- [x] Suppression puis réinsertion du contenu B2-01 existant.
- [x] Refus si une séance active existe.
- [x] Retour arrière possible sans séance.
- [x] Aucun nouveau slug ni doublon pédagogique.
- [x] Instantané serveur et fixture frontend alignés.
- [x] Les identifiants historiques `v3` restent uniquement dans la chaîne immuable des migrations et des tests de compatibilité ; le cours livré est une source unique en version technique 1 et n’expose aucune version produit V3/V4.

## Contrôles exécutés

- [x] Tests de structure, calculs, remédiations, tirages et confidentialité.
- [x] Tests de migration insertion/remplacement/refus/retour arrière.
- [x] Typecheck, lint, format, build et validation de contenu.
- [x] PostgreSQL : 9/9 tests d’intégration.
- [x] GitNexus `detect-changes --scope all` et `--scope compare --base-ref master` : risque faible.
- [x] Frontend : montage B2-01 220/220, Karma complet 3316/3316, build et typecheck.

## Validation navigateur effectuée

- [x] Parcours public réel : 52 écrans, ressources, médias, version 1 et absence de débordement.
- [x] Parcours étudiant : rattachement, flux, reprise, brouillon et réponse.
- [x] Parcours formateur : pupitre, guide, statistiques, notation et pilotage.
- [x] Contrôle mobile à 390 px et contrôle desktop à 1280 px.

## Signature pédagogique externe

- [ ] Relecture finale par l’enseignant de mathématiques BTS CG.
- [ ] Observation de la durée réelle et des réactions d’au moins trois étudiants.

La PR est techniquement contrôlée. Les deux cases restantes nécessitent des personnes réelles
et ne peuvent pas être certifiées honnêtement par un agent navigateur.
