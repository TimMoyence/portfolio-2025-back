# Gouvernance base de donnees

## 1. Source de verite

Le schema est defini par le code et les migrations. Les bases de staging ou production ne doivent jamais diverger a cause de modifications manuelles.

## 2. Workflow de changement

1. Mettre a jour le modele de persistence et le comportement repository.
2. Generer la migration depuis l'entite (`pnpm run migration:generate --name=...`). Une migration ecrite a la main declare dans l'entite, sous le meme nom, chaque clef etrangere, index, contrainte et defaut qu'elle pose : sur une base ou toutes les migrations sont jouees, la generation ne doit rien produire, ce que verifie `test/schema-entites-migrations.db-integration.spec.ts`.
   L'horodatage du nom vaut `max(maintenant, derniere migration + 1)` (`scripts/prochain-horodatage-migration.mjs`). Des migrations du depot portent un horodatage choisi a la main et situe dans le futur (jusqu'a `1792500000000`, le 20 octobre 2026) : avec l'horloge seule, une nouvelle migration se classerait avant elles et une base neuve les jouerait dans le desordre. Une migration ecrite a la main prend un horodatage superieur a la derniere migration du depot, celui du script ou un nombre rond au-dessus (les retraits de `1792200000000` a `1792500000000`), et une branche qui rattrape `master` renomme sa migration non deployee si une migration plus recente y est arrivee. TypeORM 0.3 compare les migrations par nom, pas par date : le journal « X is the last executed migration. It was executed on … » affiche la date du nom, pas celle de l'execution.
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
- La livraison des retraits, de `1792136477037-BoiteDeLivraison` a `1792500000000-RetireLeCoursOrphelin`, assume cette fenetre. `migrate` joue ses migrations dans une seule transaction. De la fin de `migrate` a l'arret de l'ancien conteneur, l'ancienne API repond 500 sur les routes qui lisent ce qui est retire : `GET /lead-magnets/toolkit/:token` et `POST /lead-magnets/formations-toolkit` (colonne `profile`), `POST /audits` (colonne `boite` requise et non ecrite), `POST /articles/ingest` et sa diffusion planifiee, la moderation admin des articles (liste, `withdraw`, `restore`, approbation et annulation de diffusion, qui lisent `article_broadcasts`), `POST /newsletter/subscribe`, `GET /newsletter/confirm`, `GET` et `POST /newsletter/unsubscribe` (tables de la newsletter). Puis l'API ne repond plus jusqu'a ce que la nouvelle soit saine. Mesure du deploiement de 32bde264 (run 38943751045, sans migration en attente) : `migrate` finit a 18:05:47.51, compose commence a recreer l'API a 18:05:47.87, l'ancien conteneur est arrete a 18:05:58.35 (delai de grace de `docker stop`), la nouvelle API est saine a 18:06:09.16. La fenetre de cette livraison vaut donc la duree de ses migrations (les requetes sur les tables touchees attendent leurs verrous), plus jusqu'a 10,5 s de 500, plus environ 11 s sans reponse. Le decoupage aurait demande une seconde livraison pour retirer ce que plus rien ne lit.
- Les migrations sans retour arriere (`RetireLAtelier`, `RetireLaNewsletter`, qui detruit les abonnes de `newsletter_subscribers`, `RetireLeCmsHerite`, `RetireLeCoursOrphelin`) bloquent `migration:revert` des la plus recente. Le deploiement de la CI prend donc, avant `migrate`, un `pg_dump` au format custom de la base que `migrate` va migrer dans `$WORKDIR/sauvegardes/avant-migrate-<date>-<sha>.dump`, et garde les cinq derniers. Cette base est la `POSTGRES_DB` que le conteneur `migrate` lit dans `backend.env` (`run --rm --no-deps -T --entrypoint printenv migrate POSTGRES_DB`), celle que `validateEnv` impose : le conteneur `db` garde l'env de sa creation et peut nommer une autre base. Une `POSTGRES_DB` absente ou vide, ou un `pg_dump` en echec, arrete le deploiement avant `migrate`. Le service `migrate` valide l'environnement comme l'API (`validateEnv`) avant de toucher la base : une env que la nouvelle API refuserait arrete le deploiement, et l'ancienne API reste en service sur l'ancien schema.
- Retour arriere apres une telle migration, chaque commande `docker compose` etant celle du deploiement (`-p portfolio25 -f <compose> --env-file backend.env`, images comprises) : `stop api`, puis `exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$1" --clean --if-exists' restauration "$BASE" < <sauvegarde>`, ou `BASE` est lue comme au deploiement (`run --rm --no-deps -T --entrypoint printenv migrate POSTGRES_DB`), puis le deploiement de l'image precedente (job `deploy` du commit precedent relance). `--clean` supprime chaque table avant de la recreer depuis la sauvegarde : tout ce que la nouvelle API a ecrit depuis `avant-migrate-<date>-<sha>.dump` est perdu (inscriptions, demandes d'audit, guides, articles, seances, participants, reponses et rapports de formation). Avant de restaurer, `stop api` puis un second `pg_dump` de l'etat courant de `BASE`, au meme format, dans `$WORKDIR/sauvegardes/` ; si une seance ou une inscription a eu lieu depuis le deploiement, un correctif en avant (nouvelle migration, nouveau deploiement) garde ces ecritures, la restauration ne les reprend que table par table depuis ce second dump.
- En production, `validateEnv` exige `POSTGRES_DB`, et refuse une base autre que `POSTGRES_DB` ou un hote autre que le service `db`, par quelque variable qu'ils arrivent (`DATABASE_URL`, `DB_NAME`, `DATABASE_NAME`, `DB_HOST`, `DATABASE_HOST`, `PGHOST`) : la sauvegarde d'avant `migrate` porte sur cette seule base. `db-backup` lit `POSTGRES_DB` a sa creation : apres une modification de `POSTGRES_DB` dans `backend.env`, `up -d db-backup` le recree sur la meme base.
- Eviter les mutations cachees au demarrage en dehors du bootstrap DB documente.
- Rendre explicites timeouts, retries et transactions quand ils comptent.

## 6. Checklist de review

- Le changement modifie-t-il schema, indexes, contraintes ou plans de requete ?
- Y a-t-il une migration ?
- La couverture d'integration repository reste-t-elle representative ?
- Les exemples d'env et docs de deploiement ont-ils ete mis a jour si le besoin operationnel change ?
