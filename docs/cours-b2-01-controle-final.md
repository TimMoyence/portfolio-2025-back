# B2-01 · BTS CG 2 — checklist de contrôle final

Cette checklist contrôle le premier cours de mathématiques de BTS CG 2 avant lundi. Le produit
ne conserve qu’un cours B2-01 en version technique 1 : la migration remplace puis republie.

## Contrat pédagogique

- [x] Public : BTS Comptabilité et gestion, 2e année, premier cours de mathématiques.
- [x] Prérequis de première année et diagnostic de reprise identifiés.
- [x] Socle BTS séparé des extensions bachelor/M1 facultatives.
- [x] Périmètre limité au traitement de l’information chiffrée, sans prétendre couvrir seul E3.
- [x] Durée cible de 210 minutes, six actes, transfert final.
- [~] Situation blanche E3 de 55 minutes identifiée comme livrable séparé.

## Progression et niveau

- [x] Chaque acte comporte un objectif observable et une production ou décision.
- [x] Moyenne pondérée placée avant le paradoxe du taux global.
- [x] Evolutions, réciproques, indices et taux moyens contrôlés par calcul inverse.
- [x] Tableur, TCD, contrôle de cohérence et reproductibilité travaillés.
- [x] Données nouvelles, correction d’erreur d’IA et recommandation structurée présentes.
- [~] Ecrans denses et charge cognitive à ajuster après observation de lundi.
- [~] Grille de correction autonome alignée sur les six compétences E3 à finaliser avec l’enseignant.

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
- [ ] Noms historiques `v3` à nettoyer dans un chantier technique séparé.

## Contrôles exécutés

- [x] Tests de structure, calculs, remédiations, tirages et confidentialité.
- [x] Tests de migration insertion/remplacement/refus/retour arrière.
- [x] Typecheck, lint, format, build et validation de contenu.
- [x] PostgreSQL : 9/9 tests d’intégration.
- [x] GitNexus `detect-changes --scope all` et `--scope compare --base-ref master` : risque faible.
- [x] Frontend : montage B2-01 220/220, Karma complet 3316/3316, build et typecheck.

## Validation humaine avant lundi

- [ ] Relecture finale par l’enseignant de mathématiques BTS CG.
- [ ] Test de durée en projection.
- [ ] Vérification lisibilité projection et 390 px.
- [ ] Vérification graphiques, alternatives, sous-titres et états réseau.
- [ ] Test avec au moins trois étudiants si disponible.
- [ ] Vérification que les extensions sont comprises comme facultatives.

La PR peut être considérée comme prête lorsque les contrôles automatisés cochés sont verts et
que les reports restent explicitement visibles. Les cases humaines non cochées constituent le
contrôle de séance, pas une dette dissimulée.
