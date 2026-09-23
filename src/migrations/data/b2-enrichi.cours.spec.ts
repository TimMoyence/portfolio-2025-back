import type { Ecran } from '../../modules/formations/domain/contrats/cours';
import { estInteractif } from '../../modules/formations/domain/cours/Cours';
import { lireCoursStocke } from '../../modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../modules/formations/domain/cours/DeroulePresentateur';
import { activitesLibres } from '../../modules/formations/domain/cours/EcranServi';
import { verifierStructure } from '../../modules/formations/domain/cours/StructureCours';
import { B2_COURS } from './b2-v3.cours';
import { B2_COURS_ENRICHI } from './b2-enrichi.cours';

const COURS = lireCoursStocke(B2_COURS_ENRICHI);
const MISSION = 'B2-01-A1-03-MISSION';
const TRI = 'B2-01-A1-05-ANATOMIE';
const CORRECTION = 'B2-01-A1-05-CORRECTION';
const DIAPOSITIVE = 'B2-01-A1-09-DIAPOSITIVE';
const AUDIT = 'B2-01-A1-10-AUDIT-DIAPOSITIVE';
const ORIGINE_AXE = 'B2-01-A2-02-ORIGINE-AXE';
const POINTS = 'B2-01-A2-06-POINTS';
const EXERCICE_POINTS = 'B2-01-A2-06-POINTS-EXERCICE';

function ecran(screenId: string): Ecran {
  const trouve = COURS.ecrans.find((candidat) => candidat.id === screenId);
  if (trouve === undefined) {
    throw new Error(`écran absent du cours enrichi : ${screenId}`);
  }
  return trouve;
}

describe('B2-01 enrichi, publié en version 3', () => {
  it('P1 · publie une nouvelle version titrée sans toucher à la version 1', () => {
    expect(B2_COURS_ENRICHI.slug).toBe(B2_COURS.slug);
    expect(B2_COURS_ENRICHI.version).toBe(3);
    expect(B2_COURS.version).toBe(1);
    expect(B2_COURS.ecrans).toHaveLength(52);
    expect(B2_COURS_ENRICHI.ecrans).toHaveLength(54);
    expect(COURS.ecrans.every(({ titre }) => titre !== null)).toBe(true);
  });

  it('P1 · ne lève aucune violation de structure', () => {
    expect(verifierStructure(COURS)).toEqual([]);
  });

  it('L3 · pose en séance les trois questions libres de la mission', () => {
    const mission = ecran(MISSION);

    expect(mission.diffusion).toBe('seance');
    expect(estInteractif(mission)).toBe(true);
    expect(
      mission.brique === 'fp-pro' &&
        mission.proprietes.questionsLibres?.map(({ question }) => question),
    ).toEqual([
      'Que mesure chaque chiffre ?',
      'Les bases et les périodes sont-elles comparables ?',
      'Le recalcul confirme-t-il la recommandation ?',
    ]);
    expect(activitesLibres(COURS).get(MISSION)).toHaveLength(3);
  });

  it('L3 · ne répète pas dans le geste les questions affichées juste en dessous', () => {
    const mission = ecran(MISSION);
    const proprietes = mission.brique === 'fp-pro' ? mission.proprietes : null;

    expect(
      (proprietes?.questionsLibres ?? []).filter(({ question }) =>
        proprietes?.geste
          .toLowerCase()
          .includes(question.slice(0, -2).toLowerCase()),
      ),
    ).toEqual([]);
    expect(proprietes?.geste).toContain('trois questions');
  });

  it('E10 · renvoie l audit, au pupitre, à la diapositive de Samir qu il commente', () => {
    const deroule = deroulePresentateur(COURS, 0);

    expect(ecran(AUDIT).renvoi).toBe(DIAPOSITIVE);
    expect(deroule.ecrans.find(({ id }) => id === AUDIT)?.renvoi).toBe(
      DIAPOSITIVE,
    );
  });

  it('E14 · donne au pupitre la réponse attendue sous la forme publiée, arrondi compris', () => {
    const corriges = deroulePresentateur(COURS, 0).ecrans.flatMap(
      (servi) => servi.corriges,
    );

    expect(
      corriges.find(
        ({ questionId }) => questionId === 'b2-01-a2-part-marketplace',
      )?.bonneReponse,
    ).toBe('45,5');
  });

  it('E13 · montre la marge en barres par année, en euros, avec un curseur d origine et deux préréglages', () => {
    const origineAxe = ecran(ORIGINE_AXE);
    if (origineAxe.brique !== 'fp-plot') {
      throw new Error('ORIGINE-AXE de brique inattendue');
    }
    const trace = origineAxe.proprietes;

    expect(trace.forme).toBe('barres');
    expect(trace.unite).toBe('euros');
    expect(trace.etiquettes).toEqual(['2022', '2023', '2024', '2025']);
    expect(trace.parametres.map(({ cle }) => cle)).toEqual(['origine']);
    expect(trace.prereglages).toEqual([
      { libelle: 'Axe de Samir', valeurs: { origine: 284000 } },
      { libelle: 'Axe à zéro', valeurs: { origine: 0 } },
    ]);
  });

  it('E17 · fait rédiger les quatre étapes de POINTS en réponses libres, juste avant la correction', () => {
    const points = ecran(POINTS);
    const rang = COURS.ecrans.findIndex(({ id }) => id === POINTS);
    const exercice = COURS.ecrans[rang - 1];
    if (points.brique !== 'fp-worked' || exercice?.brique !== 'fp-pro') {
      throw new Error('POINTS ou son exercice de brique inattendue');
    }

    expect(exercice.id).toBe(EXERCICE_POINTS);
    expect(
      exercice.proprietes.questionsLibres?.map(({ question }) => question),
    ).toEqual(points.proprietes.exemple.etapes.map(({ invite }) => invite));
    expect(activitesLibres(COURS).get(EXERCICE_POINTS)).toHaveLength(4);
  });

  it('E17 · déroule POINTS en correction pilotée au pupitre, sans saisie étudiante', () => {
    const points = ecran(POINTS);
    if (points.brique !== 'fp-worked') {
      throw new Error('POINTS de brique inattendue');
    }

    expect(points.proprietes.pilote).toBe(true);
    expect(points.proprietes.etayage).toBe(0);
    expect(activitesLibres(COURS).has(POINTS)).toBe(false);
    expect(estInteractif(points)).toBe(false);
  });

  it('E17 · renvoie la correction de POINTS à son exercice, dont le pupitre relit les réponses', () => {
    expect(ecran(POINTS).renvoi).toBe(EXERCICE_POINTS);
  });

  it('L4 · place la correction du tri juste après le tri', () => {
    const rangDuTri = COURS.ecrans.findIndex(({ id }) => id === TRI);

    expect(COURS.ecrans[rangDuTri + 1]?.id).toBe(CORRECTION);
  });

  it('L4 · range chaque carte du tri dans la catégorie de son corrigé', () => {
    const tri = ecran(TRI);
    const correction = ecran(CORRECTION);
    if (
      tri.brique !== 'fp-cardsort' ||
      tri.production.corrige.type !== 'classement' ||
      correction.brique !== 'fp-story'
    ) {
      throw new Error('tri ou correction de brique inattendue');
    }
    const { plan } = tri.proprietes;
    const { attendus } = tri.production.corrige;
    const presentation = correction.proprietes.presentation;
    if (
      presentation?.version !== 2 ||
      presentation.renderer !== 'sort-review'
    ) {
      throw new Error('la correction n est pas un rendu sort-review');
    }

    expect(presentation.props.source).toEqual({
      screenId: TRI,
      sortId: plan.id,
    });
    expect(presentation.props.categories).toEqual(
      plan.categories.map(({ id, libelle }) => ({ id, label: libelle })),
    );
    expect(presentation.props.cards).toEqual(
      plan.cartes.map(({ id, libelle }) => {
        const attendu = attendus.find(({ carteId }) => carteId === id);
        return {
          id,
          label: libelle,
          category: attendu?.categorieId,
          justification: attendu?.justification,
        };
      }),
    );
  });
});
