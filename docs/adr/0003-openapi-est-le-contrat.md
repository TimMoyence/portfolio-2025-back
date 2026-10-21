# 0003 - openapi.json est le contrat

- Statut : accepte
- Date : 2026-10-21

## Contexte

Le contrat HTTP etait ecrit deux fois : les DTO du back, et environ 2 600 lignes de zod et
d'interfaces recopiees a la main dans le front. Les deux copies divergeaient sans qu'aucun test
ne le voie : sept types d'incident sur neuf etaient jetes en silence, un taux de reussite etait
recalcule differemment au pupitre, un curseur pouvait s'arreter sur une position que le trace ne
servait pas. Plusieurs regles metier (seuil, saisie numerique, verrou des productions, option de
la bonne reponse) etaient aussi recopiees au front.

## Decision

- Le back, code-first (`@nestjs/swagger`), ecrit `openapi.json` par `pnpm openapi`
  (`scripts/ecrire-openapi.ts`, application montee en mode `preview`). Le fichier est commite ;
  `pnpm openapi:check` (CI et pre-push) refuse un `openapi.json` qui ne correspond plus au code.
- Toute entree et toute sortie est typee precisement : listes par `ValeurDuContrat`, entiers
  bornes, flux SSE en `oneOf` d'evenements nommes, donnees d'ecran liees a leur brique
  (`allOf [socle, { type: litteral, donnees }]`).
- Une regle vit au back. Le front lit ce qui est servi (part, seuil, positions des curseurs,
  saisie fermee, option de la bonne reponse) et n'en recalcule rien ; une saisie brute est lue
  par le serveur.
- Exception ecrite : l'echappement HTML existe une fois par environnement, Node pour les mails et
  PDF, navigateur pour les Custom Elements.

## Consequences

- Un champ ajoute, retire ou retype au back change `openapi.json` dans le meme commit ; le front
  le recoit en bougeant son epingle (`contrat.json`) et en regenerant.
- Le zod genere au front n'est pas strict : une cle que le back ajoute est retiree a la lecture,
  pas refusee. Une valeur hors contrat reste refusee, d'ou l'exigence de contraintes precises.
- Le walker de test (`test/helpers/schema-openapi.ts`) lit `allOf`, `oneOf` et les enumerations :
  une reponse servie qui sort du contrat fait rougir les tests http.
