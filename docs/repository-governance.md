# Gouvernance du depot Backend

Ce document decrit les regles distantes a appliquer sur GitHub pour garder `master` protege. Les fichiers du repo peuvent documenter cette politique, mais pas l'appliquer a eux seuls.

## CODEOWNERS

- Le fichier source de verite est [`.github/CODEOWNERS`](../.github/CODEOWNERS).
- Toute PR doit demander une revue du proprietaire declare sur les fichiers touches.

## Regle de protection cible

Branche cible : `master`

Parametres recommandes :

- interdire les pushes directs sur `master` ;
- exiger une pull request avant merge ;
- exiger au moins 1 approbation ;
- exiger une revue CODEOWNERS ;
- invalider les reviews obsoletes apres nouveau push ;
- exiger la resolution des conversations ;
- exiger une branche a jour avant merge ;
- interdire les merges en force et la suppression de branche protegee.

## Checks obligatoires

Les checks a rendre obligatoires dans GitHub sont :

- `quality-gate`
- `security`

`docker` et `deploy` ne doivent pas etre requis au merge, car ils ne tournent qu'apres un `push` vers `master`.

## Regle de maintenance

- Toute evolution des jobs CI doit conserver des noms de checks stables ou mettre a jour ce document dans le meme commit.
- Toute evolution de responsabilite doit mettre a jour `CODEOWNERS`.
