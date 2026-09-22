# B2-01 · BTS CG 2 — task list de livraison

## Décision produit

Le cours est le premier cours de mathématiques de BTS Comptabilité et gestion 2e année.
Le contenu pédagogique est unique dans le produit : la donnée servie porte la version technique
1, et la migration remplace le contenu B2-01 existant avant de le republier. Aucun doublon de
cours ni stockage d’une V3/V4 produit n’est attendu.

Référentiel : [BTS CG — référentiel officiel](https://enqdip.sup.adc.education.fr/bts/referentiel/BTS_ComptabiliteGestion.pdf).

## Cible pédagogique

### Socle BTS CG 2

- qualifier une donnée : unité, base, population, période, périmètre et source ;
- distinguer proportion, variations, points de pourcentage, indice et taux moyen ;
- composer des évolutions et retrouver une valeur par coefficient inverse ;
- contrôler un tableau, un graphique et un TCD ;
- produire une feuille de calcul reproductible ;
- expliquer un taux global par les poids et l’effet de structure ;
- séparer constat, hypothèse, preuve et recommandation ;
- conclure professionnellement sans dépasser les données disponibles.

### Extensions facultatives bachelor/M1

Volume/mix/taux, sensibilité, qualité des données, corrélation/causalité et IA contradicteur.
Ces extensions n’ajoutent aucun prérequis au socle BTS et ne sont pas nécessaires pour réussir
le parcours principal.

## Progression et périmètre

- [x] Positionnement public : BTS CG 2, premier cours de mathématiques, 210 minutes, six actes.
- [x] Prérequis de première année et diagnostic de reprise documentés.
- [x] Objectifs → écrans → productions → critères tracés dans la conception et les tests.
- [x] B2-01 centré sur le traitement de l’information chiffrée ; il ne prétend pas couvrir seul tout E3.
- [x] Statistique descriptive, probabilités et phénomènes exponentiels réservés aux cours suivants.
- [x] Moyenne pondérée démontrée avant le paradoxe du taux global.
- [x] Transfert autonome, correction d’une réponse d’IA et billet de sortie présents.
- [x] Test navigateur niveau 2 et charge cognitive contrôlés sur desktop et téléphone ; l’observation humaine reste une signature externe.
- [x] Situation blanche E3 de 55 minutes conservée comme livrable séparé ; grille de correction autonome jointe à cette livraison.

## Rigueur mathématique et gestion

- [x] Dénominateurs des taux de marge et de marque explicités.
- [x] Marge brute, taux de marge, taux de marque et taux global pondéré distingués.
- [x] Indice base 100 traité comme lecture/reconstitution d’un indice fourni, pas comme construction de l’IPC officiel.
- [x] Signes, unités, dates, bases et arrondis couverts par les tests.
- [x] Recommandation finale limitée à constat, mécanisme/preuve, décision/limite/contrôle.

## Extensions et charge cognitive

- [x] Sensibilité sur la part marketplace et effet volume/structure/taux présents comme prolongements.
- [x] Causalité prudente et données manquantes traitées dans l’atelier de recommandation.
- [x] Ressources BTS, bachelor et M1 séparées.
- [x] Boîte à outils imprimable, facultative, et rappels structurés.
- [x] Extensions séparées et signalées dans le cours ; un mode de masquage technique n’est pas requis pour la version de lundi.

## Lot technique

- [x] Source unique `B2_COURS`, version technique 1.
- [x] Migration de remplacement : suppression, réinsertion, remédiations, médias et publication.
- [x] Refus si une séance B2-01 existe déjà ; aucune séance active n’est écrasée silencieusement.
- [x] Retour arrière prévu lorsque aucune séance n’existe.
- [x] Instantané serveur et fixture frontend alignés.
- [x] Aucun nouveau slug ni doublon catalogue.
- [ ] Nettoyage futur des noms de fichiers historiques contenant `v3` ; ils ne constituent pas une version produit.

## Portes de validation

- [x] Structure, durée, titres, diffusion et confidentialité.
- [x] Calculs, arrondis, confusions, remédiations et tirages.
- [x] Insertion, remplacement, refus avec séance et retour arrière.
- [x] Instantané serveur et rendu frontend.
- [x] Typecheck, lint, format, build et gates backend/frontend exécutés selon le périmètre.
- [x] Intégration PostgreSQL : 9/9.
- [x] GitNexus `detect-changes` all et compare/master : risque faible.
- [x] Contrôle navigateur par rôles étudiant/formateur : public desktop/mobile, 9 scénarios étudiant et 3 scénarios formateur.

La signature par un enseignant et l’observation de vrais étudiants restent une validation
externe ; elles ne sont pas simulées comme un résultat automatisé.

## Définition de terminé

La livraison est prête pour la PR lorsque le cours unique B2-01 est publiable par migration,
les automatisations sont vertes, les reports sont explicitement nommés et la checklist de
contrôle final est jointe. Les validations humaines restantes ne sont pas présentées comme
déjà acquises.
