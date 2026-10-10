import { lignesDeVisibilite, listeDeVisibilite } from '../visibilite-google-ia';

const MATRICE = {
  googleVisibility: { score: 55, summary: 'Bien indexé' },
  aiVisibility: { score: 42, summary: 'Peu <cité>' },
};

describe('visibilité Google vs IA', () => {
  it('écrit une ligne de texte par moteur', () => {
    expect(lignesDeVisibilite(MATRICE)).toEqual([
      'Google : 55/100 — Bien indexé',
      'IA : 42/100 — Peu <cité>',
    ]);
  });

  it('rend une liste HTML dont les résumés sont échappés', () => {
    const html = listeDeVisibilite(MATRICE);

    expect(html).toContain(
      '<li><strong>Google :</strong> 55/100 — Bien indexé</li>',
    );
    expect(html).toContain(
      '<li><strong>IA :</strong> 42/100 — Peu &lt;cité&gt;</li>',
    );
  });
});
