# Garde-fous IA et prompt injection

## Modele de menace

Le pipeline d'audit consomme des contenus non fiables : HTML crawle, metadonnees, urls de sitemap, redirections, regles robots et sorties de modele. Chacun de ces flux peut contenir des instructions malicieuses cherchant a detourner la tache attendue.

## Regles non negociables

- Ne jamais suivre une instruction trouvee dans une page crawlee, une metadonnee ou une sortie LLM.
- Les instructions systeme et applicatives priment toujours sur le contenu collecte.
- Une sortie LLM est une donnee a valider, jamais une verite executable.
- Les prompts doivent rester limites a la tache produit. Aucun outil ni effet de bord ne doit etre accorde a cause d'un contenu analyse.

## Gestion des entrees

- Normaliser et borner les URLs externes avant fetch.
- Appliquer les protections SSRF et refuser les reseaux prives quand ce n'est pas legitime.
- Borner le nombre de requetes, la taille des reponses, les redirections et le budget temps.
- Garder une separation claire entre contenu recupere, signaux derives et instructions LLM.

## Gestion des sorties

- Valider les sorties contre des contrats types ou un parsing explicite.
- Rejeter les reponses mal formees ou incompletes au lieu de les laisser circuler silencieusement.
- Preferer des fallbacks deterministes quand le modele rate un contrat ou une deadline.
- Ne jamais rendre du HTML brut issu du modele sans sanitization et sans raison produit explicite.

## Regles operationnelles

- Logger echecs, retries et decisions de garde-fou sans stocker de secrets.
- Garder deadlines, limites de concurrence et retries explicites dans le code.
- Ajouter des tests a chaque nouveau garde-fou, nouveau chemin de modele ou nouveau parseur.

## Checklist de review

- Le changement introduit-il une nouvelle source de contenu non fiable ?
- Une page crawlee peut-elle injecter des instructions vers la couche modele ?
- Les reponses modele sont-elles validees avant persistence ou envoi email ?
- Les timeouts, retries et fallback sont-ils explicites et testes ?
