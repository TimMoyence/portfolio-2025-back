import type { ToolkitContent } from '../../domain/ToolkitContent';
import { ToolkitHtmlRendererService } from '../ToolkitHtmlRenderer.service';

describe('ToolkitHtmlRendererService', () => {
  let service: ToolkitHtmlRendererService;

  beforeEach(() => {
    service = new ToolkitHtmlRendererService();
  });

  const buildContent = (
    overrides: Partial<ToolkitContent> = {},
  ): ToolkitContent => ({
    recap: {
      firstName: 'Tim',
      aiLevel: 'intermediaire',
      sector: 'Coach sportif',
      budgetTier: '60',
    },
    cheatsheet: [
      {
        tool: 'ChatGPT',
        category: 'produire',
        price: 'Gratuit',
        url: 'https://chat.openai.com',
        tip: 'Le couteau suisse',
        decision: 'Brainstormer ou analyser',
        alreadyUsed: false,
      },
    ],
    prompts: [
      {
        category: 'Prospection',
        title: 'Message LinkedIn',
        level: 'debutant',
        prompt: 'Ecris un message pour {{prospect}}',
        tool: 'ChatGPT',
      },
    ],
    workflows: [
      {
        title: 'Prospection automatisee',
        description: 'Detecte les leads LinkedIn',
        setupTime: '2h',
        monthlyCost: 0,
        tools: ['Waalaxy', 'Zapier'],
        steps: [
          {
            step: 1,
            action: 'Capturer le lead',
            tool: 'Waalaxy',
            detail: 'Campagne LinkedIn ciblee',
          },
        ],
      },
    ],
    templates: [
      {
        name: 'CRM Solopreneur',
        platform: 'Notion',
        url: 'https://notion.so/templates/crm',
        description: 'Pipeline de vente complet',
        minBudget: 0,
      },
    ],
    generatedPrompt: null,
    ...overrides,
  });

  describe('render', () => {
    it('retourne un document HTML complet avec DOCTYPE', () => {
      const html = service.render(buildContent());
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="fr">');
      expect(html).toContain('</html>');
    });

    it('inclut le prenom dans la page de couverture', () => {
      const html = service.render(
        buildContent({
          recap: { ...buildContent().recap, firstName: 'Marie' },
        }),
      );
      expect(html).toContain('Marie');
    });

    it('inclut le secteur, le niveau et le budget dans la couverture', () => {
      const html = service.render(buildContent());
      expect(html).toContain('Coach sportif');
      // Le niveau est affiché avec un label traduit (Intermédiaire / Avancé / Débutant)
      expect(html.toLowerCase()).toContain('interm');
      expect(html).toContain('60');
    });

    it('rend les outils du cheatsheet avec leur URL et prix', () => {
      const html = service.render(buildContent());
      expect(html).toContain('ChatGPT');
      expect(html).toContain('https://chat.openai.com');
      expect(html).toContain('Gratuit');
      expect(html).toContain('Le couteau suisse');
    });

    it('rend les prompts avec leur contenu et metadonnees', () => {
      const html = service.render(buildContent());
      expect(html).toContain('Message LinkedIn');
      expect(html).toContain('Prospection');
      // Le niveau est affiché avec un label traduit (Débutant/Intermédiaire/Avancé)
      expect(html.toLowerCase()).toContain('but');
      expect(html).toContain('Ecris un message pour');
    });

    it('rend les workflows avec etapes numerotees', () => {
      const html = service.render(buildContent());
      expect(html).toContain('Prospection automatisee');
      expect(html).toContain('Capturer le lead');
      expect(html).toContain('Waalaxy');
      expect(html).toContain('2h');
    });

    it('rend les templates avec leur lien', () => {
      const html = service.render(buildContent());
      expect(html).toContain('CRM Solopreneur');
      expect(html).toContain('Notion');
      expect(html).toContain('https://notion.so/templates/crm');
    });

    it('omet la section prompt genere si null', () => {
      const html = service.render(buildContent({ generatedPrompt: null }));
      expect(html).not.toContain('Votre prompt personnalisé');
      expect(html).not.toContain('Votre prompt personnalise');
    });

    it('inclut la section prompt genere si present', () => {
      const html = service.render(
        buildContent({
          generatedPrompt: 'Genere-moi un plan pour coach sportif',
        }),
      );
      expect(html).toContain('Genere-moi un plan pour coach sportif');
    });

    it("utilise des valeurs par defaut si le profil n'est pas defini", () => {
      const html = service.render(
        buildContent({
          recap: {
            firstName: 'Tim',
            aiLevel: null,
            sector: null,
            budgetTier: null,
          },
        }),
      );
      expect(html).toContain('Tim');
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('inclut la date du jour formatee en francais', () => {
      const html = service.render(buildContent());
      const currentYear = new Date().getFullYear().toString();
      expect(html).toContain(currentYear);
    });

    it('rend plusieurs outils cheatsheet regroupes par categorie', () => {
      const html = service.render(
        buildContent({
          cheatsheet: [
            {
              tool: 'ChatGPT',
              category: 'produire',
              price: 'Gratuit',
              url: 'https://chat.openai.com',
              tip: 'Polyvalent',
              decision: 'Brainstormer',
              alreadyUsed: true,
            },
            {
              tool: 'Zapier',
              category: 'automatiser',
              price: 'Gratuit',
              url: 'https://zapier.com',
              tip: 'No-code',
              decision: 'Connecter deux apps',
              alreadyUsed: false,
            },
          ],
        }),
      );
      expect(html).toContain('ChatGPT');
      expect(html).toContain('Zapier');
      expect(html).toContain('https://zapier.com');
    });

    it('rend tous les niveaux de prompts (debutant, intermediaire, avance)', () => {
      const html = service.render(
        buildContent({
          prompts: [
            {
              category: 'Contenu',
              title: 'Post simple',
              level: 'debutant',
              prompt: 'Ecris un post',
              tool: 'ChatGPT',
            },
            {
              category: 'Contenu',
              title: 'Calendrier editorial',
              level: 'intermediaire',
              prompt: 'Cree un calendrier',
              tool: 'Claude',
            },
            {
              category: 'Contenu',
              title: 'Strategie 360',
              level: 'avance',
              prompt: 'Concois une strategie',
              tool: 'Claude',
            },
          ],
        }),
      );
      expect(html).toContain('Post simple');
      expect(html).toContain('Calendrier editorial');
      expect(html).toContain('Strategie 360');
    });

    it('rend le CSS inline dans une balise style', () => {
      const html = service.render(buildContent());
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it("inclut l'accent Asili dans le CSS", () => {
      const html = service.render(buildContent());
      expect(html).toContain('#4fb3a2');
    });

    it('gere une cheatsheet vide sans crasher', () => {
      const html = service.render(buildContent({ cheatsheet: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des prompts vides sans crasher', () => {
      const html = service.render(buildContent({ prompts: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des workflows vides sans crasher', () => {
      const html = service.render(buildContent({ workflows: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des templates vides sans crasher', () => {
      const html = service.render(buildContent({ templates: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });
  });
});
