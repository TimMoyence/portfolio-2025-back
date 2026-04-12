/**
 * Donnees statiques de la boite a outils IA pour solopreneurs.
 * Chaque section (cheatsheet, prompts, workflows, templates) est utilisee
 * par le ToolkitContentAssembler pour personnaliser le guide.
 *
 * Info outils a jour avril 2026. Toutes les chaines sont en francais
 * sans accents (convention du module lead-magnets).
 */

/* ------------------------------------------------------------------ */
/*  CHEATSHEET — 16 outils classes par categorie                       */
/* ------------------------------------------------------------------ */

export interface CheatsheetDataEntry {
  id: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
}

export const CHEATSHEET_DATA: CheatsheetDataEntry[] = [
  /* --- Recherche & Veille --- */
  {
    id: 'Perplexity',
    category: 'Recherche & Veille',
    price: 'Gratuit / Pro 20$/mois',
    url: 'perplexity.ai',
    tip: 'Utilisez le mode Deep Research pour des rapports sources en quelques minutes.',
    decision:
      'Tu veux une reponse sourcee avec liens verifiables → Perplexity remplace Google.',
  },
  {
    id: 'NotebookLM',
    category: 'Recherche & Veille',
    price: 'Gratuit',
    url: 'notebooklm.google',
    tip: 'Importez 5 PDF, cliquez sur Audio Overview : vous avez un podcast 2 voix en 2 minutes.',
    decision:
      'Tu as des docs longs a assimiler → NotebookLM transforme tout en podcast et Q&R interactive.',
  },
  {
    id: 'Fathom',
    category: 'Recherche & Veille',
    price: 'Gratuit / Premium 19$/mois',
    url: 'fathom.video',
    tip: 'Connectez Zoom/Meet/Teams et recevez notes, decisions et actions en automatique.',
    decision:
      'Tu fais plus de 3 reunions par semaine → Fathom te rend 2h/semaine immediatement.',
  },

  /* --- Creation de contenu --- */
  {
    id: 'ChatGPT',
    category: 'Creation de contenu',
    price: 'Gratuit / Plus 20$/mois / Pro 200$/mois',
    url: 'chat.openai.com',
    tip: 'Creez un GPT personnalise pour votre ligne editoriale : ton, formats, interdictions, exemples.',
    decision:
      'Tu veux un couteau suisse : code, strategie, brainstorming → ChatGPT reste le generaliste le plus rapide.',
  },
  {
    id: 'Claude',
    category: 'Creation de contenu',
    price: 'Gratuit / Pro 20$/mois / Max 100$/mois',
    url: 'claude.ai',
    tip: 'Utilisez les Projects pour garder votre contexte (docs, ton, exemples) sur 200K tokens.',
    decision:
      'Tu rediges des textes longs, subtils ou juridiques → Claude gagne sur la nuance et le suivi d instructions.',
  },
  {
    id: 'Gemini',
    category: 'Creation de contenu',
    price: 'Google AI Pro 19,99$/mois',
    url: 'gemini.google.com',
    tip: 'Activez Gemini dans Gmail/Docs/Sheets : il lit votre contexte Workspace sans copier-coller.',
    decision:
      'Tu vis dans Google Workspace ou tu traites de la video → Gemini 3.1 Pro (1M tokens).',
  },
  {
    id: 'Ideogram',
    category: 'Creation de contenu',
    price: 'Gratuit 10/jour / Plus 20$/mois',
    url: 'ideogram.ai',
    tip: 'Le seul generateur d images qui gere vraiment le texte lisible : idial pour affiches et logos.',
    decision:
      'Tu as besoin d un visuel AVEC du texte integre → Ideogram, sans rival.',
  },
  {
    id: 'Canva',
    category: 'Creation de contenu',
    price: 'Gratuit / Pro 15$/mois',
    url: 'canva.com',
    tip: 'Magic Studio genere carousels, visuels, presentations depuis un simple brief texte.',
    decision:
      'Tu n es pas designer et tu veux un rendu pro en 5 minutes → Canva Magic Studio.',
  },
  {
    id: 'Gamma',
    category: 'Creation de contenu',
    price: 'Gratuit 400 credits / Plus 10$/mois',
    url: 'gamma.app',
    tip: 'Tapez un prompt, choisissez 8-12 slides : Gamma genere une presentation pro en 60 secondes.',
    decision:
      'Tu dois produire une presentation pro maintenant → Gamma remplace PowerPoint.',
  },
  {
    id: 'ElevenLabs',
    category: 'Creation de contenu',
    price: 'Gratuit 10 min / Creator 22$/mois',
    url: 'elevenlabs.io',
    tip: 'Clonez votre voix en 1 minute et generez vos audios en 29 langues sans studio.',
    decision:
      'Tu produis podcasts, voice-over, audios newsletter → ElevenLabs est le gold standard.',
  },
  {
    id: 'Opus Clip',
    category: 'Creation de contenu',
    price: 'Gratuit / Starter 9,5$/mois / Pro 29$/mois',
    url: 'opus.pro',
    tip: 'Uploadez une video longue, Opus en sort 10 clips verticaux avec sous-titres et hook.',
    decision:
      'Tu veux decliner tes lives/podcasts en shorts TikTok/Reels → Opus Clip en 1 clic.',
  },

  /* --- Automatisation --- */
  {
    id: 'Zapier',
    category: 'Automatisation',
    price: 'Gratuit 100 tasks / Pro 19,99$/mois',
    url: 'zapier.com',
    tip: 'Demarrez par un Zap en 2 etapes (form → email). 8000+ apps : la bibliotheque la plus complete.',
    decision:
      'Tu veux le plus simple avec le plus d integrations → Zapier, meme si ca coute plus cher.',
  },
  {
    id: 'Make',
    category: 'Automatisation',
    price: 'Gratuit 1000 ops / Core 9€/mois',
    url: 'make.com',
    tip: 'Scenarios visuels avec branches, filtres, iterateurs : 3x plus d operations pour le meme prix.',
    decision:
      'Tu veux du volume sans te ruiner et tu aimes le visuel → Make gagne sur le ratio prix/ops.',
  },
  {
    id: 'n8n',
    category: 'Automatisation',
    price: 'Self-hosted gratuit / Cloud 20€/mois',
    url: 'n8n.io',
    tip: 'Self-hebergeable, open source, executions illimitees : vos donnees restent chez vous.',
    decision:
      'Tu es un peu technique et veux le controle total sans plafond de volume → n8n.',
  },

  /* --- Prospection & Vente --- */
  {
    id: 'Waalaxy',
    category: 'Prospection & Vente',
    price: 'Gratuit 80 invit/mois / Advanced 21€/mois',
    url: 'waalaxy.com',
    tip: 'Sequences LinkedIn + email mixees, avec pauses humaines pour eviter les bans.',
    decision:
      'Tu prospectes en B2B sur LinkedIn → Waalaxy pilote ta prospection en douceur.',
  },
  {
    id: 'Brevo',
    category: 'Prospection & Vente',
    price: 'Gratuit 300 mails/jour / Starter 9€/mois',
    url: 'brevo.com',
    tip: 'Alternative francaise RGPD a Mailchimp : emailing + SMS + CRM + transactional.',
    decision:
      'Tu veux un email marketing francais, conforme RGPD, avec CRM integre → Brevo.',
  },

  /* --- Productivite --- */
  {
    id: 'Notion AI',
    category: 'Productivite',
    price: 'Pro 16$/user/mois (IA + AI Agents inclus)',
    url: 'notion.so',
    tip: 'Depuis sept 2025, les AI Agents Notion travaillent en autonomie sur vos bases de donnees.',
    decision:
      'Tu veux centraliser wiki, CRM, projets et deleguer a des agents → Notion AI.',
  },
];

/* ------------------------------------------------------------------ */
/*  PROMPTS — 15 prompts (5 categories x 3 niveaux)                    */
/* ------------------------------------------------------------------ */

/**
 * Structure enrichie d un prompt :
 * - title, category, level, tool : metadonnees
 * - description : ce que le prompt produit en 1 phrase
 * - prompt : le prompt lui-meme, structure en sections (CONTEXTE / INSTRUCTIONS / FORMAT / TON)
 * - example : un cas d usage concret avec variables remplies
 * - tip : conseil d iteration pour ameliorer la sortie
 */
export interface PromptDataEntry {
  category: string;
  title: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  prompt: string;
  tool: string;
  description: string;
  example: string;
  tip: string;
}

export const PROMPTS_DATA: PromptDataEntry[] = [
  /* ============================================================== */
  /*  Prospection                                                    */
  /* ============================================================== */
  {
    category: 'Prospection',
    title: 'Message LinkedIn de premier contact',
    level: 'debutant',
    tool: 'ChatGPT',
    description:
      'Genere un message de connexion LinkedIn court, humain et qui ne sent pas l automatisation.',
    prompt: `CONTEXTE
Je suis {{metier}} specialise en {{niche}}. Je cible {{cible_ideale}} qui {{probleme_resolu}}.

INSTRUCTIONS
Ecris un message de premier contact LinkedIn pour {{prenom_prospect}}, {{poste_prospect}} chez {{entreprise}}.
Interdits : "J espere que vous allez bien", "Je me permets de", "formations", "opportunites".
Inclus une accroche specifique qui montre que j ai regarde son profil (mentionner {{signal_concret}}).

FORMAT ATTENDU
3 phrases maximum, pas de lien, pas de pitch, pas de CTA "prenons un cafe".
Une question ouverte en fin de message.

TON
Direct, curieux, entre pairs. Jamais servile.`,
    example:
      'Exemple : metier=consultant ops, niche=SaaS B2B, prenom_prospect=Julie, poste=Head of Growth chez Qonto, signal_concret=son post sur l onboarding self-serve de la semaine derniere. Sortie attendue : un message qui cite precisement le post et pose une question tactique sur ses resultats.',
    tip: "Si la sortie sonne generique, ajoutez 'Regles de style : phrases courtes, pas d adverbes, vocabulaire de {{cible_ideale}}'. Iterez 2-3 fois en changeant uniquement {{signal_concret}}.",
  },
  {
    category: 'Prospection',
    title: 'Sequence cold email 5 touches',
    level: 'intermediaire',
    tool: 'Claude',
    description:
      'Produit une sequence email froide complete de 5 touches avec delais, angles et A/B.',
    prompt: `CONTEXTE
Offre : {{nom_offre}} pour {{cible}}.
Pain points prioritaires : {{pain_1}}, {{pain_2}}, {{pain_3}}.
Preuve sociale : {{resultat_client_existant}}.

INSTRUCTIONS
Cree une sequence cold email de 5 touches espacees de J, J+3, J+7, J+14, J+21.
Chaque touche a un angle different :
1. Probleme specifique (pas de pitch)
2. Mini-etude de cas chiffree
3. Ressource gratuite (template, audit, checklist)
4. Question ouverte (break-up soft)
5. Break-up email definitif

FORMAT ATTENDU
Pour chaque touche : objet (max 6 mots, ne jamais commencer par une majuscule), corps (80 mots max), CTA unique.
Tableau markdown avec colonnes : # | Jour | Angle | Objet | Corps | CTA.

TON
Ecrit comme un humain presse. Zero jargon corporate. Passe le test "est-ce que je l enverrais a un ami ?".`,
    example:
      'Exemple : offre=audit SEO 90 min, cible=e-commerces DTC 500k-5M CA, pain=Google Update recent, resultat_client=+42% trafic en 6 semaines pour un client mode. Sortie : 5 emails prets a coller dans Brevo ou Lemlist.',
    tip: "Pour eviter le ton IA : ajoutez 'Ecris comme si tu tapais depuis ton telephone a un collegue. Fautes de frappe acceptees.' Testez la touche 3 (ressource) en premier, elle a le meilleur taux de reponse.",
  },
  {
    category: 'Prospection',
    title: 'Analyse profil prospect et brief personnalise',
    level: 'avance',
    tool: 'Claude',
    description:
      'Transforme un profil LinkedIn brut en fiche strategique avec accroches sur mesure.',
    prompt: `CONTEXTE
Voici le profil LinkedIn complet d un prospect : {{coller_profil_complet}}
Mon offre : {{offre}}.
Mon ICP : {{icp}}.

INSTRUCTIONS
1. Resume le parcours du prospect en 3 phrases.
2. Identifie 3 pain points probables bases sur son contexte actuel (pas generiques).
3. Cherche 3 signaux recents (posts, commentaires, changements) qui justifient un contact maintenant.
4. Evalue le fit avec mon ICP sur 10 et explique pourquoi.
5. Redige 2 accroches de contact : une directe (probleme) et une indirecte (curiosity).

FORMAT ATTENDU
Fiche structuree en 5 blocs markdown avec titres ## et bullet points. Chaque accroche en bloc citation.

TON
Analytique, factuel, sans flatterie. Si le fit est mauvais, dis-le.`,
    example:
      'Exemple : profil=Head of Marketing chez startup Series A sante, offre=brand strategy, ICP=fondateurs 500k-2M ARR. Sortie : fiche de 1 page utilisable directement pour qualifier et contacter.',
    tip: 'Lancez le prompt sur 10 profils d un coup en collant chaque profil entre des balises <profil_1></profil_1>. Claude peut traiter 200K tokens : profitez-en pour batcher vos qualifications.',
  },

  /* ============================================================== */
  /*  Contenu                                                        */
  /* ============================================================== */
  {
    category: 'Contenu',
    title: 'Post LinkedIn opinion tranchee',
    level: 'debutant',
    tool: 'ChatGPT',
    description:
      'Genere un post LinkedIn avec une prise de position claire, le format qui cartonne en 2026.',
    prompt: `CONTEXTE
Je suis {{metier}}, je parle a {{audience}}.
Sujet du post : {{sujet}}.
Mon avis : {{prise_de_position}}.

INSTRUCTIONS
Ecris un post LinkedIn qui defend ma prise de position. Structure :
- Ligne 1 : une affirmation contre-intuitive (hook)
- Lignes 2-3 : le contexte (pourquoi on se trompe)
- Lignes 4-8 : 3 arguments factuels avec exemples precis
- Ligne 9 : conclusion pratique
- Ligne 10 : question qui invite a commenter

INTERDITS
- "Dans un monde ou", "A l ere de", "Plus que jamais"
- Emojis en debut de ligne
- Liste a puces (rend le post generique)
- Conclusion "qu en pensez-vous ?"

FORMAT ATTENDU
200-250 mots. Phrases courtes. Espaces entre chaque bloc.

TON
Direct, un peu provocateur, sur de soi sans arrogance.`,
    example:
      "Exemple : metier=coach business, audience=freelances tech, sujet=le personal branding, prise_de_position=Le personal branding est une escroquerie pour 90% des freelances. Sortie : un post qui demarre par 'Ton personal branding te coute plus qu il ne te rapporte' et defend l idee avec 3 exemples chiffres.",
    tip: "Les posts qui sonnent 'IA genere' sont scrolles. Apres generation, retirez 1 adjectif sur 2 et rajoutez un detail specifique vecu (un chiffre, un nom de client, un echec concret).",
  },
  {
    category: 'Contenu',
    title: 'Carrousel LinkedIn 8 slides',
    level: 'intermediaire',
    tool: 'Claude',
    description:
      'Structure un carrousel LinkedIn de 8 slides, format le plus performant en 2026 (+20% engagement).',
    prompt: `CONTEXTE
Sujet central : {{sujet}}.
Audience : {{audience}}.
Objectif : {{objectif_post}} (autorite / lead magnet / debat).

INSTRUCTIONS
Cree un carrousel de 8 slides :
- Slide 1 (cover) : hook contre-intuitif ou chiffre choc, max 8 mots
- Slide 2 : contexte / probleme (pose l enjeu)
- Slides 3-7 : une idee par slide, max 15 mots + 1 phrase d explication
- Slide 8 : CTA clair + question pour engagement

Pour chaque slide, donne aussi :
- Le brief visuel en 1 phrase (ce qu on voit)
- Le texte principal
- Une note de bas de slide optionnelle

FORMAT ATTENDU
Tableau markdown : Slide | Visuel | Texte principal | Note
Puis en dessous : texte du post LinkedIn qui accompagne le carrousel (150 mots, avec les 3-5 premieres lignes qui agissent comme un teaser).

TON
Assertif, pedagogique, sans cliches LinkedIn.`,
    example:
      'Exemple : sujet=les 5 erreurs de pricing des consultants, audience=consultants 1-3 ans d experience, objectif=autorite. Sortie : 8 slides plus le post d accompagnement, prets a coller dans Canva.',
    tip: 'Testez 2 versions du slide 1 (hook rationnel vs hook emotionnel) et gardez celui qui a le meilleur taux de completion sur les 3 premiers jours. Le slide 1 fait 80% de la performance.',
  },
  {
    category: 'Contenu',
    title: 'Calendrier editorial 4 semaines + repurposing',
    level: 'avance',
    tool: 'Claude',
    description:
      'Construit un calendrier 4 semaines avec un pilier de contenu decline en 12 formats.',
    prompt: `CONTEXTE
Metier : {{metier}}.
Audience cible : {{audience}}.
Pilier de contenu du mois : {{pilier_thematique}}.
Canaux : LinkedIn, newsletter, YouTube shorts.

INSTRUCTIONS
1. Decline le pilier en 4 sous-themes (un par semaine).
2. Pour chaque semaine, propose :
   - 3 posts LinkedIn (lundi opinion, mercredi case study, vendredi format court fill-in-the-blank)
   - 1 newsletter (theme + angle + 3 sections)
   - 1 short YouTube (hook + script 30s)
3. Indique les liens entre les contenus (repurposing) : comment le post du lundi nourrit la newsletter du jeudi puis le short du vendredi.
4. Genere 1 idee de lead magnet qui peut etre issue du mois.

FORMAT ATTENDU
Tableau par semaine. Chaque ligne = un contenu avec : jour, canal, titre, hook, angle, reutilisation.
Termine par un bloc "Pilier du mois : timeline de repurposing" qui trace le flux asset principal → 12 contenus.

TON
Strategique, orienté action. Chaque idee doit etre assez precise pour etre executee demain.`,
    example:
      "Exemple : metier=UX designer freelance, audience=fondateurs SaaS B2B, pilier=l UX research low-budget. Sortie : 12 contenus programmables dans Notion + un ebook 'Guide UX research 0-1000€' comme lead magnet.",
    tip: "Demandez a Claude d ajouter une colonne 'fill-in-the-blank' pour 3 posts : ces formats a faible barriere ont le plus fort engagement en 2026. Exemple : 'Mon erreur la plus chere en tant que freelance ? ___'",
  },

  /* ============================================================== */
  /*  Automatisation                                                 */
  /* ============================================================== */
  {
    category: 'Automatisation',
    title: 'Mon premier Zap guide pas-a-pas',
    level: 'debutant',
    tool: 'ChatGPT',
    description:
      'Explique en 6 etapes tres concretes comment creer un Zap formulaire → email sans se perdre.',
    prompt: `CONTEXTE
Je n ai jamais utilise Zapier. Je veux creer mon premier Zap : quand quelqu un remplit mon formulaire Tally, il recoit un email de bienvenue automatique.

INSTRUCTIONS
Explique-moi etape par etape, comme a un debutant complet :
1. Comment creer mon compte Zapier et ou trouver "Create Zap"
2. Comment choisir Tally comme trigger et connecter mon formulaire
3. Comment tester que Zapier recoit bien les donnees
4. Comment ajouter l action "Send Email via Gmail"
5. Comment personnaliser l email avec le prenom de la personne (variable dynamique)
6. Comment tester puis activer le Zap

FORMAT ATTENDU
6 etapes numerotees. Chaque etape : 1 phrase d objectif + 3-4 sous-etapes concretes avec les boutons EXACTS a cliquer (entre guillemets).
Termine par "Checklist de verification" avec 3 points a cocher.

TON
Patient, bienveillant, zero jargon. Comme si tu expliquais a ta mere.`,
    example:
      'Cas concret : une coach de yoga qui veut envoyer automatiquement son planning PDF a chaque inscription newsletter. Sortie : guide pas a pas utilisable en 20 minutes sans connaissance technique.',
    tip: "Si vous bloquez a une etape, copiez-collez l erreur exacte dans ChatGPT avec 'Je suis bloque a l etape X, voici ce que je vois : ...'. ChatGPT vous donnera la correction en 1 message.",
  },
  {
    category: 'Automatisation',
    title: 'Workflow Make lead → CRM → relance',
    level: 'intermediaire',
    tool: 'ChatGPT',
    description:
      'Decrit un scenario Make complet pour capter, enrichir et relancer un lead automatiquement.',
    prompt: `CONTEXTE
Je veux un scenario Make.com qui :
1. Detecte un nouveau lead depuis un formulaire Tally
2. Enrichit le lead via Apollo (entreprise, taille, poste)
3. L ajoute comme nouvelle ligne dans ma base Notion CRM
4. Envoie un email personnalise via Brevo
5. Planifie une tache de rappel dans mon Notion a J+3

INSTRUCTIONS
Decris le scenario module par module :
- Nom du module Make a utiliser
- Action precise (avec le nom du bouton)
- Parametres a configurer (avec exemples de valeurs)
- Mapping des variables entre modules
- Gestion des erreurs (que faire si Apollo ne trouve pas l entreprise)

FORMAT ATTENDU
Liste numerotee. Chaque module : bloc avec Titre / Action / Parametres / Mapping / Erreur.
Termine par un bloc "Tests a faire avant d activer" avec 5 cas de test.

TON
Technique mais accessible. Donne le nom exact des champs Make.`,
    example:
      'Cas concret : un formateur freelance recoit 5-10 leads par semaine depuis sa landing page. Sortie : scenario Make pret a configurer en 90 minutes, avec gestion des erreurs documentees.',
    tip: 'Ajoutez un module Router apres l enrichissement : si le lead vient d une entreprise > 50 personnes, route vers une sequence VIP (email personnel du fondateur) au lieu de la sequence standard.',
  },
  {
    category: 'Automatisation',
    title: 'Pipeline n8n veille + digest IA quotidien',
    level: 'avance',
    tool: 'Claude',
    description:
      'Produit la structure JSON d un workflow n8n autonome de veille + synthese Claude + envoi email.',
    prompt: `CONTEXTE
Je veux un workflow n8n qui tourne tous les matins a 7h et qui :
1. Surveille 10 flux RSS de ma niche
2. Filtre les articles publies dans les dernieres 24h contenant des mots-cles {{mots_cles}}
3. Envoie chaque article a l API Claude pour extraction (titre, resume 3 lignes, insight actionnable)
4. Regroupe tout dans un digest HTML
5. M envoie ce digest par email via SMTP
6. Stocke l historique dans une base SQLite pour eviter les doublons

INSTRUCTIONS
Decris chaque node n8n avec :
- Type de node (Schedule Trigger, RSS Feed, Filter, HTTP Request, Function, Email Send, SQLite)
- Parametres exacts (expressions n8n avec ={{$json...}})
- Expressions de mapping entre nodes
- Gestion des erreurs (Retry / Continue on Fail)

Donne le JSON exportable du workflow (structure n8n standard).

FORMAT ATTENDU
1. Diagramme texte du workflow (nodes et connexions)
2. Description node par node
3. JSON complet du workflow pret a importer

TON
Technique, precis. Pas d approximations sur les noms de nodes ou d expressions.`,
    example:
      'Cas concret : un consultant IA veut un digest quotidien des nouveautes ML / AI agents. Sortie : un workflow n8n autonome, self-hosted, gratuit, qui remplace une heure de veille par jour.',
    tip: "Ajoutez un node 'Merge' avant l envoi email pour grouper les articles par theme (IA / No-code / Marketing). Claude fera un meilleur digest avec une instruction 'regroupe par theme'.",
  },

  /* ============================================================== */
  /*  Site web                                                       */
  /* ============================================================== */
  {
    category: 'Site web',
    title: 'Page d accueil solopreneur qui convertit',
    level: 'debutant',
    tool: 'ChatGPT',
    description:
      'Redige le copywriting d une home page orientee conversion en 6 sections cles.',
    prompt: `CONTEXTE
Je suis {{metier}} specialise en {{niche}}.
Ma cible : {{cible}}.
Ma transformation : {{avant_apres}}.
Mon offre principale : {{nom_offre}} a {{prix}}.
Mes 3 preuves : {{preuve_1}}, {{preuve_2}}, {{preuve_3}}.

INSTRUCTIONS
Ecris le contenu d une home page en 6 sections :
1. Hero : sur-titre (6 mots), titre (12 mots max, focus transformation), sous-titre (20 mots), CTA principal + CTA secondaire
2. Probleme : 3 points de douleur que vit la cible (phrases ou elle se reconnait)
3. Solution : comment je resouds, en 3 benefices concrets (pas de features)
4. Preuve : 3 cases studies mini avec chiffres
5. Offre : qu est-ce qui est inclus, pour qui c est (et pour qui ca ne l est pas)
6. FAQ : 5 questions qui freinent l achat + reponses rassurantes

FORMAT ATTENDU
Bloc par section avec titre ## section, puis le copy pret a coller.
Entre chaque section, une note "Objectif de cette section" en 1 phrase.

TON
Humain, direct, pas de jargon marketing. Utilise "tu" ou "vous" selon l audience precisee.`,
    example:
      'Cas concret : coach sportif a domicile sur Paris, cible=femmes 35-50, offre=programme 12 semaines a 1200€. Sortie : une page d accueil complete prete a implementer dans Framer, Webflow ou Wordpress.',
    tip: "Remplacez 'Je vous aide a' par 'Vous saurez' ou 'Vous arreterez de' : les formulations centrees sur le client convertissent 2-3x mieux. Testez avec Hotjar sur 200 visiteurs avant de conclure.",
  },
  {
    category: 'Site web',
    title: 'Landing page avec framework PAS',
    level: 'intermediaire',
    tool: 'Claude',
    description:
      'Produit une landing page optimisee conversion avec framework PAS (Probleme - Agitation - Solution) et variantes A/B.',
    prompt: `CONTEXTE
Offre : {{nom_offre}}.
Cible precise : {{persona_detaille}}.
Prix : {{prix}}.
Delai d obtention du resultat : {{delai}}.
Garantie : {{garantie}}.

INSTRUCTIONS
Ecris une landing page en 7 sections suivant le framework PAS etendu :

1. HERO : headline focus transformation (verbe actif), sub-headline (qui + comment + delai), CTA
2. PROBLEME : 5 points de douleur en bullet "Tu as essaye X, Y, Z et pourtant..."
3. AGITATION : 1 paragraphe qui decrit le cout de ne rien faire (emotions + chiffres)
4. SOLUTION : presentation de l offre en 3 parties (methode, deliverables, accompagnement)
5. PREUVE : 3 temoignages structures (contexte / probleme / resultat chiffre)
6. FAQ : 7 questions dont 3 objections prix/temps
7. GARANTIE + CTA final

Pour chaque CTA, donne 3 variantes A/B a tester.
Pour le headline, donne 3 variantes (rationnel / emotionnel / curiosity gap).

FORMAT ATTENDU
Sections numerotees. Pour chaque element testable, encadre "A/B TEST" avec les variantes.

TON
Conversationnel, vendeur sans etre pushy. Adapte le registre au persona.`,
    example:
      'Cas concret : offre=audit SEO 997€ pour e-commerces DTC, cible=fondateurs e-com 500k-3M CA, resultat en 30 jours. Sortie : landing page complete + 9 variantes CTA + 3 variantes headline, pret a implementer en Framer.',
    tip: "Pour la section Agitation, demandez a Claude 'cite les mots exacts que ma cible utilise' : copiez 5 reviews Trustpilot ou Reddit de vos concurrents dans le contexte, Claude imitera le vocabulaire et triplera la resonance.",
  },
  {
    category: 'Site web',
    title: 'Audit UX copywriting avec reecriture',
    level: 'avance',
    tool: 'Claude',
    description:
      'Analyse une landing existante, identifie les frictions et produit une version reecrite section par section.',
    prompt: `CONTEXTE
Voici le contenu actuel de ma landing page : {{coller_contenu_complet}}
Offre : {{offre}}.
Objectif principal : {{conversion_cible}} (rdv / achat / lead).
Audience : {{audience}}.
Taux de conversion actuel : {{taux_actuel}}%.

INSTRUCTIONS
1. AUDIT : identifie les 5 frictions principales qui bloquent la conversion (clarte, preuve, pertinence, objection, CTA). Pour chaque : citation exacte + diagnostic + effet sur la conversion.
2. REECRITURE : pour chaque friction, propose une version reecrite avec :
   - Le texte original (en bloc citation)
   - Le texte corrige
   - Le "pourquoi" du changement (en 1 phrase avec principe cialdini ou heuristique UX)
3. RECOMMANDATIONS : 3 changements structurels (ordre des sections, element manquant, element a supprimer).
4. SCORING : note sur 10 pour chaque section (clarte / pertinence / preuve / CTA / objection).

FORMAT ATTENDU
Section 1 : tableau audit (friction / extrait / diagnostic / impact)
Section 2 : blocs avant/apres
Section 3 : recommandations en bullet
Section 4 : scorecard visuelle en tableau

TON
Analytique, honnete. Si le probleme est structurel (mauvaise offre, mauvaise cible), dis-le.`,
    example:
      'Cas concret : landing page d un coach business avec 0,8% de conversion (objectif 2%). Sortie : audit complet + version reecrite + plan d implementation en 1 page.',
    tip: "Apres l audit, demandez a Claude 'propose 3 tests A/B prioritaires par ordre de ROI estime'. Vous aurez une feuille de route de tests pour les 3 mois a venir au lieu d un one-shot.",
  },

  /* ============================================================== */
  /*  Gestion client                                                 */
  /* ============================================================== */
  {
    category: 'Gestion client',
    title: 'Email de relance bienveillant',
    level: 'debutant',
    tool: 'ChatGPT',
    description:
      'Redige une relance douce pour un client qui a ghoste sans passer pour insistant.',
    prompt: `CONTEXTE
J ai envoye {{nature_envoi}} a {{prenom_client}} le {{date_envoi}}. Sans reponse depuis.
Notre contexte : {{contexte_relation}} (nouveau prospect / client en cours / devis en attente).
Valeur de l affaire : {{montant}}€.

INSTRUCTIONS
Ecris un email de relance qui :
- Ne commence pas par "je me permets de"
- Ne dit pas "je reviens vers vous"
- Offre une porte de sortie honorable ("si ce n est plus d actualite, dites-le moi simplement")
- Contient une mini-valeur ajoutee (une ressource, une idee, une question)
- Propose un creneau precis (pas "quand vous etes dispo")

FORMAT ATTENDU
Objet (4-6 mots, direct). Corps (100 mots max). Signature simple.

TON
Confiant, decontracte, zero servilite. Comme si vous ecriviez a un collegue.`,
    example:
      'Cas concret : devis de 3500€ envoye a un prospect consultant il y a 8 jours, pas de reponse. Sortie : un email qui donne envie de repondre meme pour dire non.',
    tip: "Si le prospect ne repond toujours pas apres cette relance, envoyez un break-up email 10 jours plus tard avec pour objet 'fermeture du dossier ?' : taux de reponse moyen de 30%.",
  },
  {
    category: 'Gestion client',
    title: 'Proposition commerciale structuree',
    level: 'intermediaire',
    tool: 'Claude',
    description:
      'Genere une proposition commerciale complete en 8 sections qui convertit mieux qu un devis Excel.',
    prompt: `CONTEXTE
Client : {{nom_client}} ({{secteur}}, {{taille}}).
Contexte exprime par le client : {{contexte_client}}.
Objectifs : {{objectifs}}.
Mes deliverables : {{liste_deliverables}}.
Budget : {{prix}}€ HT.
Duree : {{duree}}.

INSTRUCTIONS
Ecris une proposition commerciale en 8 sections :

1. RESUME EXECUTIF (1/2 page) : contexte en 3 phrases + valeur creee en 1 phrase
2. COMPREHENSION DU BESOIN : reformulation du probleme client avec ses mots
3. APPROCHE : methodologie en 3-5 etapes claires
4. DELIVERABLES : ce qui est inclus (liste precise) + ce qui ne l est pas (important)
5. PLANNING : timeline visuelle semaine par semaine
6. INVESTISSEMENT : prix + ce que le prix couvre + 2 options (standard + premium)
7. POURQUOI MOI : 3 raisons non-generiques (pas "passionne" ni "a l ecoute")
8. CONDITIONS : modalites de paiement, duree de validite, prochaines etapes

FORMAT ATTENDU
Markdown structure. Chaque section : titre ## + contenu. Option premium en encadre.

TON
Professionnel, confiant, jamais commercial. Le client doit sentir qu il signe avec un expert, pas un vendeur.`,
    example:
      'Cas concret : proposition de refonte de site web pour un cabinet d avocats (15k€, 8 semaines). Sortie : une propale de 3-4 pages en markdown, convertible en PDF avec Pandoc ou Notion.',
    tip: "Ajoutez une section 'Hypotheses' apres la methodologie : listez 3-5 hypotheses que vous faites sur le projet. Ca rassure les clients avertis et ca limite votre expo aux changements de scope.",
  },
  {
    category: 'Gestion client',
    title: 'Systeme post-prestation feedback + upsell',
    level: 'avance',
    tool: 'Claude',
    description:
      'Designe un systeme complet de 5 emails post-livraison : satisfaction, temoignage, cas d usage, upsell, parrainage.',
    prompt: `CONTEXTE
Ma prestation : {{prestation}}.
Type de clients : {{type_clients}}.
Resultat typique pour le client : {{resultat_type}}.
Mon offre upsell : {{offre_upsell}}.
Mon offre de parrainage : {{offre_parrainage}}.

INSTRUCTIONS
Cree un systeme de 5 emails post-livraison automatisables dans Brevo ou Make :

1. J+1 : accuse de satisfaction + CTA enquete courte (3 questions max)
2. J+7 : email "comment ca se passe ?" + proposition d un call si blocages
3. J+14 : demande de temoignage structuree avec 3 questions guidees (pas "ecris un temoignage")
4. J+30 : retour d experience + proposition d offre upsell (contextualisee au resultat du client)
5. J+60 : proposition de parrainage avec incentive clair

Pour chaque email, indique :
- Objet (5-7 mots)
- Corps structure (120 mots max)
- CTA unique et specifique
- Condition de declenchement (doit-on sauter si pas de reponse au precedent ?)
- Variables dynamiques a remplir ({{prenom}}, {{resultat_specifique}}, ...)

FORMAT ATTENDU
5 blocs emails + 1 bloc "Logique de declenchement" en pseudo-code.

TON
Humain, authentique, jamais "client value automation". Chaque email doit donner l impression d etre ecrit a la main.`,
    example:
      'Cas concret : webdesigner freelance qui livre des sites Webflow. Sortie : 5 emails pret a configurer dans Brevo avec conditions de declenchement, transformant 30% des clients en prescripteurs.',
    tip: "Personnalisez l email J+14 (temoignage) en citant un detail specifique de la prestation recue ('ta remarque sur le menu mobile m a fait rire'). Taux de reponse passe de 20% a 60%.",
  },
];

/* ------------------------------------------------------------------ */
/*  WORKFLOWS — 3 workflows detailles                                  */
/* ------------------------------------------------------------------ */

export interface WorkflowStepData {
  step: number;
  action: string;
  tool: string;
  detail: string;
}

export interface WorkflowDataEntry {
  title: string;
  description: string;
  setupTime: string;
  monthlyCost: number;
  steps: WorkflowStepData[];
  tools: string[];
}

export const WORKFLOWS_DATA: WorkflowDataEntry[] = [
  {
    title: 'Prospection LinkedIn → CRM → sequence email auto',
    description:
      'Capte les prospects LinkedIn, enrichit les fiches dans Notion et declenche une sequence email personnalisee par segment, sans intervention manuelle.',
    setupTime: '3h',
    monthlyCost: 21,
    steps: [
      {
        step: 1,
        action: 'Creer une campagne Waalaxy multi-touches (invit + 2 messages)',
        tool: 'Waalaxy',
        detail:
          'Cibler par filtres Sales Navigator : poste, taille entreprise, secteur. Template de message avec variables {{firstName}} et {{company}}. Activer les pauses humaines (8-17h, max 40 invit/jour).',
      },
      {
        step: 2,
        action: 'Connecter Waalaxy a Zapier via webhook',
        tool: 'Zapier',
        detail:
          "Trigger 'New Connection Accepted'. Zapier recupere nom, prenom, entreprise, poste, URL profil LinkedIn.",
      },
      {
        step: 3,
        action: 'Enrichir automatiquement le prospect',
        tool: 'Perplexity',
        detail:
          "Via API Perplexity : prompt 'Donne-moi en 3 bullets les infos cles de {{company}} (taille, business model, actualite recente)'. Resultat stocke en variable Zapier.",
      },
      {
        step: 4,
        action: 'Creer une fiche enrichie dans Notion CRM',
        tool: 'Notion AI',
        detail:
          "Action Notion 'Create Database Item'. Champs : Nom, Entreprise, Poste, Source=LinkedIn, Enrichissement=[texte Perplexity], Statut=A contacter, Score lead (formule Notion auto).",
      },
      {
        step: 5,
        action: 'Router par segment et declencher la bonne sequence Brevo',
        tool: 'Brevo',
        detail:
          "Filter Zapier : si entreprise > 50 salaries → liste Brevo 'Entreprise', sinon → liste 'TPE-PME'. Chaque liste a sa propre sequence de 5 emails.",
      },
      {
        step: 6,
        action: 'Notifier Slack/email + creer tache de rappel J+5',
        tool: 'Notion AI',
        detail:
          "Si lead score > 70 (calcul Notion), creer une tache 'Call prioritaire' dans la database Taches avec deadline J+2. Notification Slack au responsable.",
      },
    ],
    tools: ['Waalaxy', 'Zapier', 'Perplexity', 'Notion AI', 'Brevo'],
  },
  {
    title: 'Contenu multicanal : 1 article → 12 assets',
    description:
      'A partir d un seul article pilier, genere automatiquement 3 posts LinkedIn, 1 carrousel, 1 newsletter, 1 short video et les visuels associes en moins d 1h par pilier.',
    setupTime: '2h',
    monthlyCost: 29,
    steps: [
      {
        step: 1,
        action: 'Rediger un article pilier dans Claude (Project dedie)',
        tool: 'Claude',
        detail:
          "Project Claude 'Ligne editoriale 2026' avec vos docs de ton, exemples, interdictions. Prompt : 'Article pilier 1500 mots sur {{sujet}} avec framework {{structure}}'.",
      },
      {
        step: 2,
        action: 'Decliner en 3 posts LinkedIn + 1 carrousel dans ChatGPT',
        tool: 'ChatGPT',
        detail:
          "GPT personnalise 'Repurposing LinkedIn' charge avec l article. Sortie : 3 angles differents (opinion / case / fill-in-the-blank) + script carrousel 8 slides.",
      },
      {
        step: 3,
        action: 'Generer les visuels avec Canva Magic Studio',
        tool: 'Canva',
        detail:
          "Template Canva 'Brand Kit solopreneur' avec vos couleurs et fonts. Magic Design genere 3 variantes par slide. Ideogram en backup pour les slides avec gros texte.",
      },
      {
        step: 4,
        action: 'Transformer le podcast ou une video en 5 clips sociaux',
        tool: 'Opus Clip',
        detail:
          'Uploader la video source (interview, live, webinar). Opus Clip genere automatiquement 5 clips verticaux de 30-60s avec sous-titres, hook et score viralite.',
      },
      {
        step: 5,
        action: 'Generer une version audio de l article',
        tool: 'ElevenLabs',
        detail:
          'Cloner votre voix une fois, puis convertir l article en MP3 de 6-8 min a integrer dans la newsletter (lien audio) ou comme mini-podcast quotidien.',
      },
      {
        step: 6,
        action: 'Planifier la diffusion multi-canal via Zapier',
        tool: 'Zapier',
        detail:
          'Zap qui publie lundi (post LinkedIn 1), mercredi (carrousel), jeudi (newsletter Brevo), vendredi (short video), samedi (audio). Centralise dans un Google Sheet pour suivi.',
      },
    ],
    tools: ['Claude', 'ChatGPT', 'Canva', 'Opus Clip', 'ElevenLabs', 'Zapier'],
  },
  {
    title: 'Veille concurrentielle auto + digest hebdomadaire',
    description:
      'Surveille vos 10 concurrents et mots-cles secteur, synthetise avec NotebookLM et genere un digest actionnable chaque lundi matin.',
    setupTime: '1h30',
    monthlyCost: 0,
    steps: [
      {
        step: 1,
        action: 'Configurer les sources de veille',
        tool: 'Perplexity',
        detail:
          "Creer 1 Space Perplexity 'Veille concurrentielle' avec : 10 domaines concurrents, 5 mots-cles secteur, 3 hashtags LinkedIn. Activer Deep Research hebdomadaire.",
      },
      {
        step: 2,
        action: 'Centraliser les alertes Google + RSS',
        tool: 'Zapier',
        detail:
          "Trigger 'New Google Alert'. Action : creer une entree dans une base Notion 'Veille' avec date, source, extrait, lien. Deduplication par URL.",
      },
      {
        step: 3,
        action: 'Generer une analyse IA chaque dimanche soir',
        tool: 'Perplexity',
        detail:
          "Prompt programme : 'Analyse les contenus de la semaine ecoulee de mes concurrents {{liste}} et identifie : 3 nouvelles angles, 3 opportunites, 3 risques concurrentiels'. Sortie enregistree dans Notion.",
      },
      {
        step: 4,
        action: 'Synthetiser en podcast avec NotebookLM',
        tool: 'NotebookLM',
        detail:
          'Uploader les 10 articles les plus pertinents de la semaine dans un nouveau notebook. Generer un Audio Overview de 8-10 min a ecouter en voiture le lundi matin.',
      },
      {
        step: 5,
        action: 'Rediger le digest executif avec Claude',
        tool: 'Claude',
        detail:
          "Prompt : 'A partir de ces 10 articles, ecris un digest de 400 mots avec : 3 insights cles, 1 opportunite immediate, 1 risque a surveiller, 1 idee de contenu pour la semaine'.",
      },
      {
        step: 6,
        action: 'Envoyer le digest chaque lundi 7h par email',
        tool: 'Brevo',
        detail:
          "Campagne automatisee 'Digest veille' avec variables. Template minimaliste. Bouton 'Archiver dans Notion' qui declenche un Zap d archivage.",
      },
    ],
    tools: [
      'Perplexity',
      'Zapier',
      'NotebookLM',
      'Claude',
      'Brevo',
      'Notion AI',
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  TEMPLATES — 8 templates prets a l'emploi                           */
/* ------------------------------------------------------------------ */

export interface TemplateDataEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: number;
}

export const TEMPLATES_DATA: TemplateDataEntry[] = [
  {
    name: 'CRM Solopreneur',
    platform: 'Notion',
    url: 'https://www.notion.com/templates/category/crm',
    description:
      'Pipeline de vente visuel, fiches prospects enrichies, suivi relances et dashboards metriques.',
    minBudget: 0,
  },
  {
    name: 'Calendrier editorial 4 semaines',
    platform: 'Notion',
    url: 'https://www.notion.com/templates/category/content-calendar',
    description:
      'Planification hebdo multi-canaux avec statuts, kanban et timeline de repurposing.',
    minBudget: 0,
  },
  {
    name: 'Dashboard solopreneur (CA, taches, objectifs)',
    platform: 'Notion',
    url: 'https://www.notion.com/templates/category/personal',
    description:
      'Vue 360 de ton activite : chiffre d affaires mensuel, taches de la semaine, objectifs trimestriels, bilan hebdo.',
    minBudget: 0,
  },
  {
    name: 'Onboarding client automatise',
    platform: 'Zapier',
    url: 'https://zapier.com/apps/gmail/integrations/notion',
    description:
      'Zap pret : formulaire Tally → email bienvenue → fiche Notion → rappel J+3 dans ton calendrier.',
    minBudget: 0,
  },
  {
    name: 'Publication LinkedIn depuis Google Sheet',
    platform: 'Zapier',
    url: 'https://zapier.com/apps/linkedin/integrations/google-sheets',
    description:
      'Planifie 20 posts dans un Sheet, Zapier publie automatiquement selon la date et l heure.',
    minBudget: 0,
  },
  {
    name: 'Pipeline de contenu multicanal',
    platform: 'Make',
    url: 'https://www.make.com/en/templates',
    description:
      'Scenario visuel : 1 article → 3 posts LinkedIn → 1 newsletter → 3 visuels Canva → diffusion auto.',
    minBudget: 9,
  },
  {
    name: 'Lead scoring et routing automatise',
    platform: 'Make',
    url: 'https://www.make.com/en/templates',
    description:
      'Enrichit chaque lead entrant, calcule un score et le route vers la bonne sequence ou alerte Slack.',
    minBudget: 9,
  },
  {
    name: 'AI Agent commercial Notion (beta 2025+)',
    platform: 'Notion',
    url: 'https://www.notion.com/product/ai',
    description:
      'Agent qui qualifie les leads entrants, met a jour le CRM, prepare les emails de relance et attend ta validation.',
    minBudget: 16,
  },
];
