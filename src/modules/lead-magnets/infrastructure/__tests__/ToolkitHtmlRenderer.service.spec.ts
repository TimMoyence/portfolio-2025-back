import { buildToolkitContent } from '../../../../../test/factories/lead-magnet-request.factory';
import { couvertureRendue } from '../../../../../test/helpers/couverture-de-pdf';
import { htmlEmis } from '../../../../common/domain/texte/html-escape.util';
import type { ToolkitContent } from '../../domain/ToolkitContent';
import { ToolkitHtmlRendererService } from '../ToolkitHtmlRenderer.service';

describe('ToolkitHtmlRendererService', () => {
  let service: ToolkitHtmlRendererService;

  beforeEach(() => {
    service = new ToolkitHtmlRendererService();
  });

  const rendre = (content: ToolkitContent): string =>
    htmlEmis(service.render(content));

  describe('render', () => {
    it('retourne un document HTML complet avec DOCTYPE', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="fr">');
      expect(html).toContain('</html>');
    });

    it('inclut le prenom dans la page de couverture', () => {
      const html = rendre(
        buildToolkitContent({
          recap: { ...buildToolkitContent().recap, firstName: 'Marie' },
        }),
      );
      expect(html).toContain('Marie');
    });

    it('rend la couverture du guide au seul prenom, sans badge (LEG-06)', () => {
      jest.useFakeTimers({ now: Date.parse('2026-04-15T10:00:00Z') });
      try {
        const html = rendre(
          buildToolkitContent({
            recap: { ...buildToolkitContent().recap, firstName: 'Léa <3' },
          }),
        );

        expect(couvertureRendue(html)).toBe(
          '<section class="page cover"><div class="cover-gradient">' +
            '<div class="cover-shape cover-shape-1"></div><div class="cover-shape cover-shape-2"></div>' +
            '<div class="cover-shape cover-shape-3"></div></div><div class="cover-content">' +
            '<p class="cover-eyebrow">🚀 Asili Design — Guide personnalisé</p>' +
            '<h1 class="cover-title">L\'IA au service<br/>des solopreneurs</h1>' +
            '<p class="cover-subtitle">Votre boîte à outils sur mesure pour transformer votre activité avec l\'IA en 2026.</p>' +
            '<div class="cover-meta"><p class="cover-prepared">Préparé pour <strong>Léa &lt;3</strong></p>' +
            '<p class="cover-date">15 avril 2026</p></div></div>' +
            '<footer class="cover-footer"><span>asilidesign.fr</span><span>•</span>' +
            '<span>Guide généré sur mesure</span><span>•</span><span>Édition 2026</span></footer></section>',
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('rend les outils du cheatsheet avec leur URL et prix', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('ChatGPT');
      expect(html).toContain('https://chat.openai.com');
      expect(html).toContain('Gratuit');
      expect(html).toContain('Le couteau suisse');
    });

    it('rend les prompts avec leur contenu et metadonnees', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('Message LinkedIn');
      expect(html).toContain('Prospection');
      expect(html.toLowerCase()).toContain('but');
      expect(html).toContain('Ecris un message pour');
    });

    it('rend la description, l exemple et l astuce quand ils sont fournis', () => {
      const html = rendre(
        buildToolkitContent({
          prompts: [
            {
              category: 'Prospection',
              title: 'Message enrichi',
              level: 'debutant',
              prompt: 'Ecris un message',
              tool: 'Claude',
              description: 'Produit un message court et humain.',
              example: 'Exemple : cible=consultant, signal=post LinkedIn.',
              tip: 'Iterez en changeant uniquement la variable signal.',
            },
          ],
        }),
      );
      expect(html).toContain('Produit un message court et humain.');
      expect(html).toContain('Exemple : cible=consultant');
      expect(html).toContain('Iterez en changeant uniquement');
      expect(html).toContain("Cas d'usage");
      expect(html).toContain("Astuce d'it");
    });

    it('omet les blocs description / example / tip quand ils sont absents', () => {
      const html = rendre(buildToolkitContent());
      expect(html).not.toContain("Cas d'usage");
      expect(html).not.toContain("Astuce d'it");
    });

    it('rend la page stats avec les chiffres cles solopreneurs', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('Pourquoi ce guide');
      expect(html).toContain('74');
      expect(html).toContain('64');
      expect(html).toContain('91');
    });

    it('rend les workflows avec etapes numerotees', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('Prospection automatisee');
      expect(html).toContain('Capturer le lead');
      expect(html).toContain('Waalaxy');
      expect(html).toContain('2h');
    });

    it('rend les templates avec leur lien', () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('CRM Solopreneur');
      expect(html).toContain('Notion');
      expect(html).toContain('https://notion.so/templates/crm');
    });

    it('ne rend ni puce d usage, ni prompt genere, ni tri par niveau (LEG-06)', () => {
      const html = rendre(
        Object.assign(buildToolkitContent(), {
          generatedPrompt: 'Genere-moi un plan pour coach sportif',
        }),
      );

      expect(html).not.toContain('class="chip');
      expect(html).not.toContain('Genere-moi un plan');
      expect(html).not.toContain('Votre prompt');
      expect(html).not.toContain('Personnalisés selon votre niveau');
      expect(html).toContain('Pour tous les niveaux');
    });

    it('inclut la date du jour formatee en francais', () => {
      const html = rendre(buildToolkitContent());
      const currentYear = new Date().getFullYear().toString();
      expect(html).toContain(currentYear);
    });

    it('rend plusieurs outils cheatsheet regroupes par categorie', () => {
      const html = rendre(
        buildToolkitContent({
          cheatsheet: [
            {
              tool: 'ChatGPT',
              category: 'produire',
              price: 'Gratuit',
              url: 'https://chat.openai.com',
              tip: 'Polyvalent',
              decision: 'Brainstormer',
            },
            {
              tool: 'Zapier',
              category: 'automatiser',
              price: 'Gratuit',
              url: 'https://zapier.com',
              tip: 'No-code',
              decision: 'Connecter deux apps',
            },
          ],
        }),
      );
      expect(html).toContain('ChatGPT');
      expect(html).toContain('Zapier');
      expect(html).toContain('https://zapier.com');
    });

    it('rend tous les niveaux de prompts (debutant, intermediaire, avance)', () => {
      const html = rendre(
        buildToolkitContent({
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
      const html = rendre(buildToolkitContent());
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('teinte categories, prompts et templates par classe, jamais par un style interpole', () => {
      const html = rendre(buildToolkitContent());

      expect(html).toContain('class="category-title teinte-accent"');
      expect(html).toContain('class="prompt-card teinte-rose"');
      expect(html).toContain('class="template-card plateforme-notion"');
      expect(html).toMatch(/\.prompt-card\.teinte-rose\s*\{[^}]*#ec4899/);
      expect(html).toMatch(
        /\.template-card\.plateforme-notion \.platform-badge\s*\{[^}]*#0f172a/,
      );
    });

    it('force https sur le lien d un outil sans laisser passer un autre schema', () => {
      const html = rendre(buildToolkitContent());

      expect(html).toContain('href="https://chat.openai.com"');
    });

    it('neutralise un outil dont l URL porte un schema hostile', () => {
      const html = rendre(
        buildToolkitContent({
          cheatsheet: [
            {
              tool: 'Piege',
              category: 'produire',
              price: 'Gratuit',
              url: 'javascript:alert(1)',
              tip: 'x',
              decision: 'x',
            },
          ],
        }),
      );

      expect(html).not.toMatch(/href="\s*javascript:/i);
      expect(html).toContain('href="https://javascript:alert(1)"');
    });

    it('etale l outil seul de sa categorie par une classe, sans style interpole', () => {
      const html = rendre(buildToolkitContent());

      expect(html).toContain('class="tool-card tool-card-solo"');
      expect(html).not.toContain('style="grid-column');
    });

    it("inclut l'accent Asili dans le CSS", () => {
      const html = rendre(buildToolkitContent());
      expect(html).toContain('#4fb3a2');
    });

    it('gere une cheatsheet vide sans crasher', () => {
      const html = rendre(buildToolkitContent({ cheatsheet: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des prompts vides sans crasher', () => {
      const html = rendre(buildToolkitContent({ prompts: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des workflows vides sans crasher', () => {
      const html = rendre(buildToolkitContent({ workflows: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('gere des templates vides sans crasher', () => {
      const html = rendre(buildToolkitContent({ templates: [] }));
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });
  });
});
