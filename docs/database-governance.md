# Gouvernance base de donnees

## 1. Source de verite

Le schema est defini par le code et les migrations. Les bases de staging ou production ne doivent jamais diverger a cause de modifications manuelles.

## 2. Workflow de changement

1. Mettre a jour le modele de persistence et le comportement repository.
2. Ajouter ou generer une migration.
3. Ajouter ou mettre a jour la couverture d'integration si requetes, indexes, pagination ou filtres changent.
4. Documenter toute nouvelle variable d'environnement ou etape operationnelle.

## 3. Regles d'environnement

- Les bases locale, CI et production doivent rester isolees.
- Le flux DB integration documente existe pour eviter les collisions avec la base locale principale.
- Les parametres de connexion viennent uniquement de l'environnement. Aucun credential en dur.

## 4. Discipline requetes et indexes

- Les repositories portent la composition de requetes et le mapping specifique a la persistence.
- Pagination, tri et filtres sont du comportement de contrat et imposent des tests.
- Toute nouvelle lecture doit etre evaluee aussi sous l'angle index et perf, pas seulement correction fonctionnelle.
- Quand un index est ajoute, la migration et les assertions d'integration DB doivent evoluer ensemble.

## 5. Regles de fiabilite

- Privilegier des migrations deterministes et des plans operationnels reversibles.
- Eviter les mutations cachees au demarrage en dehors du bootstrap DB documente.
- Rendre explicites timeouts, retries et transactions quand ils comptent.

## 6. Checklist de review

- Le changement modifie-t-il schema, indexes, contraintes ou plans de requete ?
- Y a-t-il une migration ?
- La couverture d'integration repository reste-t-elle representative ?
- Les exemples d'env et docs de deploiement ont-ils ete mis a jour si le besoin operationnel change ?
