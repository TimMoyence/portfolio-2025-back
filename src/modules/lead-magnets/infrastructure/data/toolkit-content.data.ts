/**
 * Donnees statiques de la boite a outils IA pour solopreneurs.
 * Chaque section (cheatsheet, prompts, workflows, templates) est utilisee
 * par le ToolkitContentAssembler pour personnaliser le guide.
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
  {
    id: 'notebooklm',
    category: 'Recherche & Veille',
    price: 'Gratuit',
    url: 'notebooklm.google',
    tip: "Importez vos PDF et laissez l'IA creer un podcast resume.",
    decision: 'Ideal pour synthetiser des documents longs.',
  },
  {
    id: 'perplexity',
    category: 'Recherche & Veille',
    price: 'Gratuit',
    url: 'perplexity.ai',
    tip: 'Utilisez le mode "Focus" pour cibler vos sources.',
    decision: 'Remplace Google pour la recherche factuelle avec sources.',
  },
  {
    id: 'fathom',
    category: 'Recherche & Veille',
    price: 'Gratuit',
    url: 'fathom.video',
    tip: 'Enregistrez vos reunions et obtenez un resume automatique.',
    decision: 'Indispensable si vous faites plus de 3 reunions/semaine.',
  },
  {
    id: 'chatgpt',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'chat.openai.com',
    tip: 'Creez des GPTs personnalises pour vos taches recurrentes.',
    decision: 'Le couteau suisse : texte, strategie, code.',
  },
  {
    id: 'claude',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'claude.ai',
    tip: 'Utilisez les "Projects" pour garder du contexte entre conversations.',
    decision: "Meilleur pour les textes longs et l'analyse nuancee.",
  },
  {
    id: 'gemini',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'gemini.google.com',
    tip: 'Connectez votre Drive et Gmail pour des reponses contextuelles.',
    decision: "Ideal si vous etes dans l'ecosysteme Google.",
  },
  {
    id: 'ideogram',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'ideogram.ai',
    tip: 'Excellent pour les visuels avec du texte integre (logos, affiches).',
    decision: "Le meilleur generateur d'images avec texte lisible.",
  },
  {
    id: 'gamma',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'gamma.app',
    tip: "Generez une presentation complete a partir d'un simple brief.",
    decision: 'Remplace PowerPoint pour les presentations rapides.',
  },
  {
    id: 'elevenlabs',
    category: 'Creation de contenu',
    price: '5$/mois',
    url: 'elevenlabs.io',
    tip: 'Clonez votre voix pour creer du contenu audio authentique.',
    decision: 'Necessaire si vous produisez des podcasts ou videos.',
  },
  {
    id: 'zapier',
    category: 'Automatisation',
    price: 'Gratuit',
    url: 'zapier.com',
    tip: "Commencez par automatiser l'envoi d'emails de bienvenue.",
    decision: 'Le plus simple pour debuter en automatisation.',
  },
  {
    id: 'make',
    category: 'Automatisation',
    price: '9$/mois',
    url: 'make.com',
    tip: 'Les scenarios visuels permettent des workflows complexes.',
    decision: 'Plus puissant que Zapier pour les workflows multi-etapes.',
  },
  {
    id: 'n8n',
    category: 'Automatisation',
    price: 'Gratuit',
    url: 'n8n.io',
    tip: 'Auto-hebergeable : vos donnees restent chez vous.',
    decision: 'Pour les profils techniques qui veulent le controle total.',
  },
  {
    id: 'waalaxy',
    category: 'Prospection & Vente',
    price: 'Gratuit',
    url: 'waalaxy.com',
    tip: 'Automatisez votre prospection LinkedIn avec des sequences personnalisees.',
    decision: 'Indispensable pour la prospection B2B sur LinkedIn.',
  },
  {
    id: 'notion-ai',
    category: 'Productivite',
    price: 'Gratuit',
    url: 'notion.so',
    tip: "Utilisez l'IA pour resumer vos notes et generer des actions.",
    decision: 'Centralise tout : wiki, projets, CRM, notes.',
  },
  {
    id: 'brevo',
    category: 'Prospection & Vente',
    price: 'Gratuit',
    url: 'brevo.com',
    tip: 'Creez des sequences email automatisees pour vos leads.',
    decision: "Emailing + CRM gratuit jusqu'a 300 emails/jour.",
  },
  {
    id: 'canva-ai',
    category: 'Creation de contenu',
    price: 'Gratuit',
    url: 'canva.com',
    tip: 'Utilisez Magic Design pour generer des visuels depuis un brief.',
    decision: 'Le plus accessible pour les non-designers.',
  },
];

/* ------------------------------------------------------------------ */
/*  PROMPTS — 15 prompts (5 categories x 3 niveaux)                    */
/* ------------------------------------------------------------------ */

export interface PromptDataEntry {
  category: string;
  title: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  prompt: string;
  tool: string;
}

export const PROMPTS_DATA: PromptDataEntry[] = [
  // --- Prospection ---
  {
    category: 'Prospection',
    title: 'Message de premier contact LinkedIn',
    level: 'debutant',
    prompt:
      'Ecris un message LinkedIn de premier contact pour un [SECTEUR]. Le ton doit etre amical et professionnel. Propose une valeur concrete en 3 lignes maximum.',
    tool: 'ChatGPT',
  },
  {
    category: 'Prospection',
    title: 'Sequence de prospection multi-canal',
    level: 'intermediaire',
    prompt:
      'Cree une sequence de prospection en 5 etapes (LinkedIn + email) pour un solopreneur en [SECTEUR]. Inclus les delais entre chaque etape et un angle de personnalisation.',
    tool: 'Claude',
  },
  {
    category: 'Prospection',
    title: 'Analyse de profil prospect et accroche personnalisee',
    level: 'avance',
    prompt:
      "Analyse ce profil LinkedIn [COLLER LE PROFIL]. Identifie 3 pain points probables et redige une accroche personnalisee qui montre que j'ai compris son contexte.",
    tool: 'Claude',
  },

  // --- Contenu ---
  {
    category: 'Contenu',
    title: 'Post LinkedIn simple',
    level: 'debutant',
    prompt:
      "Ecris un post LinkedIn sur [SUJET] pour un solopreneur en [SECTEUR]. Utilise le format : accroche → probleme → solution → appel a l'action. 200 mots max.",
    tool: 'ChatGPT',
  },
  {
    category: 'Contenu',
    title: 'Calendrier editorial mensuel',
    level: 'intermediaire',
    prompt:
      "Cree un calendrier editorial LinkedIn pour 4 semaines (3 posts/semaine) pour un [SECTEUR]. Alterne entre : expertise, behind-the-scenes, social proof. Donne le theme et l'angle de chaque post.",
    tool: 'ChatGPT',
  },
  {
    category: 'Contenu',
    title: 'Strategie de contenu 360 avec repurposing',
    level: 'avance',
    prompt:
      'A partir de cette idee centrale : [IDEE], cree un plan de repurposing en 7 formats : 1 article long, 3 posts LinkedIn, 1 carousel, 1 script video court, 1 newsletter. Chaque format doit avoir un angle different.',
    tool: 'Claude',
  },

  // --- Automatisation ---
  {
    category: 'Automatisation',
    title: 'Mon premier Zap',
    level: 'debutant',
    prompt:
      "Explique-moi etape par etape comment creer un Zap qui envoie un email de bienvenue automatique quand quelqu'un remplit un formulaire Google Forms. Utilise des termes simples.",
    tool: 'ChatGPT',
  },
  {
    category: 'Automatisation',
    title: 'Workflow CRM automatise',
    level: 'intermediaire',
    prompt:
      "Decris un workflow Make.com qui : 1) detecte un nouveau lead depuis un formulaire, 2) l'ajoute dans Notion, 3) envoie un email personnalise, 4) planifie un rappel J+3. Donne les modules a utiliser.",
    tool: 'ChatGPT',
  },
  {
    category: 'Automatisation',
    title: "Pipeline d'automatisation multi-outils",
    level: 'avance',
    prompt:
      "Conçois un pipeline n8n complet qui : surveille les mentions de ma marque (Google Alerts), les enrichit avec Perplexity, genere une reponse contextuelle avec Claude, et m'envoie un digest quotidien par email. Donne le JSON du workflow.",
    tool: 'Claude',
  },

  // --- Site web ---
  {
    category: 'Site web',
    title: "Page d'accueil qui convertit",
    level: 'debutant',
    prompt:
      "Ecris le contenu d'une page d'accueil pour un solopreneur en [SECTEUR]. Structure : hero avec proposition de valeur, 3 benefices, temoignage, appel a l'action. Ton professionnel mais humain.",
    tool: 'ChatGPT',
  },
  {
    category: 'Site web',
    title: 'Landing page optimisee conversion',
    level: 'intermediaire',
    prompt:
      "Cree le contenu d'une landing page pour [OFFRE] en [SECTEUR]. Inclus : headline accrocheur, sous-titre, 5 bullet points benefices, section FAQ (5 questions), et 2 variantes de CTA a tester.",
    tool: 'Claude',
  },
  {
    category: 'Site web',
    title: 'Audit UX et optimisation du parcours',
    level: 'avance',
    prompt:
      "Analyse cette page [COLLER L'URL ou LE CONTENU]. Identifie les 5 principaux freins a la conversion, propose des corrections concretes avec des exemples de copywriting ameliore pour chaque section.",
    tool: 'Claude',
  },

  // --- Gestion client ---
  {
    category: 'Gestion client',
    title: 'Email de suivi client',
    level: 'debutant',
    prompt:
      "Ecris un email de suivi pour un client qui n'a pas repondu depuis 5 jours. Ton : bienveillant, pas insistant. Propose un creneau de rappel. Max 100 mots.",
    tool: 'ChatGPT',
  },
  {
    category: 'Gestion client',
    title: 'Template de proposition commerciale',
    level: 'intermediaire',
    prompt:
      'Cree un template de proposition commerciale pour un solopreneur en [SECTEUR]. Sections : contexte client, objectifs, solution proposee, livrables, planning, investissement, conditions. Ton professionnel.',
    tool: 'Claude',
  },
  {
    category: 'Gestion client',
    title: 'Systeme de feedback et upsell automatise',
    level: 'avance',
    prompt:
      "Conçois un systeme complet de suivi post-prestation : email de satisfaction J+7, demande de temoignage J+14, proposition d'upsell J+30. Inclus les templates email et les criteres de declenchement.",
    tool: 'Claude',
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
    title: 'Prospection automatisee LinkedIn → CRM',
    description:
      'Detecte les nouveaux prospects LinkedIn, enrichit leurs donnees et les ajoute automatiquement dans votre CRM Notion.',
    setupTime: '2h',
    monthlyCost: 0,
    steps: [
      {
        step: 1,
        action: 'Configurer Waalaxy pour la prospection LinkedIn',
        tool: 'Waalaxy',
        detail:
          'Creer une campagne de connexion ciblee avec messages personnalises.',
      },
      {
        step: 2,
        action: 'Connecter Waalaxy a Zapier via webhook',
        tool: 'Zapier',
        detail: 'Declencher un Zap a chaque nouvelle connexion acceptee.',
      },
      {
        step: 3,
        action: 'Enrichir le profil avec Perplexity',
        tool: 'Perplexity',
        detail:
          "Rechercher automatiquement l'entreprise du prospect pour personnaliser le suivi.",
      },
      {
        step: 4,
        action: 'Ajouter le lead dans Notion CRM',
        tool: 'Notion AI',
        detail:
          'Creer une fiche prospect avec les donnees enrichies et un statut "A contacter".',
      },
      {
        step: 5,
        action: 'Envoyer un email de bienvenue personnalise',
        tool: 'Brevo',
        detail:
          'Declencher une sequence email automatique adaptee au profil du prospect.',
      },
    ],
    tools: ['Waalaxy', 'Zapier', 'Perplexity', 'Notion AI', 'Brevo'],
  },
  {
    title: 'Contenu multicanal automatise',
    description:
      'Creez un article puis declinez-le automatiquement en post LinkedIn, newsletter et visuel.',
    setupTime: '1h30',
    monthlyCost: 5,
    steps: [
      {
        step: 1,
        action: 'Rediger un article long avec Claude',
        tool: 'Claude',
        detail:
          'Utiliser un Project avec votre ligne editoriale pour garder la coherence.',
      },
      {
        step: 2,
        action: 'Generer 3 posts LinkedIn avec ChatGPT',
        tool: 'ChatGPT',
        detail:
          "Extraire 3 angles differents de l'article et les formater en posts courts.",
      },
      {
        step: 3,
        action: 'Creer les visuels avec Canva AI',
        tool: 'Canva AI',
        detail:
          'Utiliser Magic Design pour generer des visuels assortis a chaque post.',
      },
      {
        step: 4,
        action: 'Generer un audio resume avec ElevenLabs',
        tool: 'ElevenLabs',
        detail:
          "Transformer l'article en version audio de 3 minutes pour votre newsletter.",
      },
      {
        step: 5,
        action: 'Planifier la diffusion via Zapier',
        tool: 'Zapier',
        detail:
          "Automatiser la publication et l'envoi newsletter a des jours precis.",
      },
    ],
    tools: ['Claude', 'ChatGPT', 'Canva AI', 'ElevenLabs', 'Zapier'],
  },
  {
    title: 'Veille concurrentielle automatique',
    description:
      'Surveillez vos concurrents et votre marche automatiquement, avec un rapport hebdomadaire synthetise par IA.',
    setupTime: '1h',
    monthlyCost: 0,
    steps: [
      {
        step: 1,
        action: 'Configurer les alertes Google Alerts',
        tool: 'Google Alerts',
        detail:
          'Creer des alertes sur vos concurrents, mots-cles secteur et votre propre marque.',
      },
      {
        step: 2,
        action: 'Centraliser les alertes dans Notion',
        tool: 'Zapier',
        detail:
          'Chaque alerte cree automatiquement une entree dans votre base de veille Notion.',
      },
      {
        step: 3,
        action: 'Analyser les tendances avec Perplexity',
        tool: 'Perplexity',
        detail:
          'Chaque semaine, demander une analyse des tendances de votre secteur.',
      },
      {
        step: 4,
        action: 'Synthetiser avec NotebookLM',
        tool: 'NotebookLM',
        detail:
          'Importer les articles de la semaine et generer un resume executif.',
      },
      {
        step: 5,
        action: 'Generer un rapport avec Claude',
        tool: 'Claude',
        detail:
          'Creer un rapport hebdomadaire avec les opportunites identifiees et les actions recommandees.',
      },
    ],
    tools: ['Google Alerts', 'Zapier', 'Perplexity', 'NotebookLM', 'Claude'],
  },
];

/* ------------------------------------------------------------------ */
/*  TEMPLATES — 7 templates prets a l'emploi                           */
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
    url: 'https://notion.so/templates/crm-solopreneur',
    description:
      'Base de donnees clients avec pipeline de vente, suivi des interactions et relances automatiques.',
    minBudget: 0,
  },
  {
    name: 'Calendrier editorial',
    platform: 'Notion',
    url: 'https://notion.so/templates/calendrier-editorial',
    description:
      'Planification de contenu mensuel avec categories, statuts et dates de publication.',
    minBudget: 0,
  },
  {
    name: 'Tableau de bord activite',
    platform: 'Notion',
    url: 'https://notion.so/templates/dashboard-solopreneur',
    description:
      "Vue d'ensemble de votre activite : CA, clients, taches, objectifs mensuels.",
    minBudget: 0,
  },
  {
    name: 'Onboarding client automatise',
    platform: 'Zapier',
    url: 'https://zapier.com/shared/onboarding-client',
    description:
      'Zap complet : formulaire → email bienvenue → fiche Notion → rappel J+3.',
    minBudget: 0,
  },
  {
    name: 'Publication LinkedIn programmee',
    platform: 'Zapier',
    url: 'https://zapier.com/shared/linkedin-scheduler',
    description:
      'Publiez automatiquement depuis un Google Sheet vers LinkedIn.',
    minBudget: 0,
  },
  {
    name: 'Pipeline de contenu multicanal',
    platform: 'Make',
    url: 'https://make.com/templates/content-pipeline',
    description:
      'Scenario complet : article → 3 posts sociaux → newsletter → visuels.',
    minBudget: 60,
  },
  {
    name: 'Lead scoring automatise',
    platform: 'Make',
    url: 'https://make.com/templates/lead-scoring',
    description:
      'Enrichissement et scoring automatique des leads entrants avec notification.',
    minBudget: 60,
  },
];
