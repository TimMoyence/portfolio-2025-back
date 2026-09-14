import { buildCoursDeTest } from '../../../../../test/factories/cours.factory';
import { CONFUSIONS } from './banque/confusions';
import { deroulePresentateur, SEUIL_PAR_DEFAUT } from './DeroulePresentateur';
import type { CorrigePresentateur, EcranDeroule } from './DeroulePresentateur';
import { tirer } from './Tirage';

describe('deroulePresentateur', () => {
  const cours = buildCoursDeTest();
  const deroule = deroulePresentateur(cours, 424);
  const ecran = (id: string): EcranDeroule =>
    deroule.ecrans.find((candidat) => candidat.id === id)!;

  it('reprend le sujet du tirage de reference', () => {
    const sujet = tirer(cours, 424).sujet;
    expect(
      deroule.ecrans.map(({ id, type, duree, interactif, donnees }) => ({
        id,
        type,
        duree,
        interactif,
        donnees,
      })),
    ).toEqual(sujet.ecrans);
  });

  it('ajoute les notes, le seuil et le corrige de chaque ecran', () => {
    expect(ecran('E-OUV').notes).toBe('Rappel');
    expect(ecran('E-OUV').seuil).toBeCloseTo(0.6);
    expect(ecran('E-NUM').seuil).toBe(SEUIL_PAR_DEFAUT);
    expect(ecran('E-CITATION').seuil).toBeNull();
    expect(ecran('E-EXIT').seuil).toBeNull();
    expect(
      ecran('E-PRATIQUE').corriges.map((corrige) => corrige.questionId),
    ).toEqual(['Q-TEST-NUM-2', 'Q-TEST-NUM-3', 'Q-TEST-VOTE']);
    const corrigeAttendu: CorrigePresentateur = {
      questionId: 'Q-TEST-RAPPEL',
      bonneReponse: 'plus bas qu’au départ',
      confusions: [
        {
          id: 'hausse-baisse-symetriques',
          libelle: CONFUSIONS['hausse-baisse-symetriques'].libelle,
        },
        {
          id: 'raisonnement-additif',
          libelle: CONFUSIONS['raisonnement-additif'].libelle,
        },
      ],
    };
    expect(ecran('E-OUV').corriges[0]).toEqual(corrigeAttendu);
  });

  it('expose les remediations du cours', () => {
    expect(deroule.remediations).toEqual({
      'hausse-baisse-symetriques': 'E-REM',
      'raisonnement-additif': 'E-REM',
      'ecart-absolu-au-lieu-du-taux': 'E-REM',
    });
  });
});
