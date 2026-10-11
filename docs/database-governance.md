# Gouvernance base de donnees

## 1. Source de verite

Le schema est defini par le code et les migrations. Les bases de staging ou production ne doivent jamais diverger a cause de modifications manuelles.

## 2. Workflow de changement

1. Mettre a jour le modele de persistence et le comportement repository.
2. Generer la migration depuis l'entite (`pnpm run migration:generate --name=...`). Une migration ecrite a la main declare dans l'entite, sous le meme nom, chaque clef etrangere, index, contrainte et defaut qu'elle pose : sur une base ou toutes les migrations sont jouees, la generation ne doit rien produire, ce que verifie `test/schema-entites-migrations.db-integration.spec.ts`.
   L'horodatage du nom vaut `max(maintenant, derniere migration + 1)` (`scripts/prochain-horodatage-migration.mjs`). Des migrations du depot portent un horodatage choisi a la main et situe dans le futur (jusqu'a `1790900000000`, le 2 octobre 2026) : avec l'horloge seule, une nouvelle migration se classerait avant elles et une base neuve les jouerait dans le desordre. Une migration ecrite a la main prend cet horodatage, et une branche qui rattrape `master` renomme sa migration non deployee si une migration plus recente y est arrivee. TypeORM 0.3 compare les migrations par nom, pas par date : le journal « X is the last executed migration. It was executed on … » affiche la date du nom, pas celle de l'execution.
3. Ajouter ou mettre a jour la couverture d'integration si requetes, indexes, pagination ou filtres changent.
4. Documenter toute nouvelle variable d'environnement ou etape operationnelle.

## 3. Regles d'environnement

- Les bases locale, CI et production doivent rester isolees.
- Le flux DB integration documente existe pour eviter les collisions avec la base locale principale. Chaque suite d'integration vide son schema : `test/helpers/db-integration-datasource.ts` ignore `DATABASE_URL` et refuse toute base dont le nom ne finit pas par `_ci` ou `_test`.
- Les parametres de connexion viennent uniquement de l'environnement. Aucun credential en dur.

## 4. Discipline requetes et indexes

- Les repositories portent la composition de requetes et le mapping specifique a la persistence.
- Pagination, tri et filtres sont du comportement de contrat et imposent des tests.
- Toute nouvelle lecture doit etre evaluee aussi sous l'angle index et perf, pas seulement correction fonctionnelle.
- Quand un index est ajoute, la migration et les assertions d'integration DB doivent evoluer ensemble.

## 5. Regles de fiabilite

- Privilegier des migrations deterministes et des plans operationnels reversibles.
- Une migration qui renomme ou retire une colonne lue par l'API en service ouvre une fenetre d'indisponibilite : la CI joue `migrate` avant `up -d --wait api` (jusqu'a 90 s), et l'ancienne API cherche encore l'ancienne colonne pendant ce temps. Le decoupage expand/contract la ferme, au prix de deux livraisons. Quand on l'ecarte, la limite est assumee ici.
- `1791624795249-HacheLesJetonsDeVerification` assume cette fenetre : pendant le demarrage de la nouvelle API, l'inscription, la verification d'e-mail et son renvoi repondent 500 (un compte cree alors n'a pas de jeton et redemande un renvoi). Le decoupage aurait garde les jetons en clair jusqu'a la seconde livraison. La migration ne fait rien sur une base ou `token_hash` existe deja (base de dev synchronisee par `TYPEORM_SYNCHRONIZE`).
- Eviter les mutations cachees au demarrage en dehors du bootstrap DB documente.
- Rendre explicites timeouts, retries et transactions quand ils comptent.

## 6. Checklist de review

- Le changement modifie-t-il schema, indexes, contraintes ou plans de requete ?
- Y a-t-il une migration ?
- La couverture d'integration repository reste-t-elle representative ?
- Les exemples d'env et docs de deploiement ont-ils ete mis a jour si le besoin operationnel change ?
