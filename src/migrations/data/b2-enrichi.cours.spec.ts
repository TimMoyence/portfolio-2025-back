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
const JEU = 'B2-01-A2-07-JEU-COMPARABLE';
const MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
const DIAPOSITIVE = 'B2-01-A1-09-DIAPOSITIVE';
const AUDIT = 'B2-01-A1-10-AUDIT-DIAPOSITIVE';

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

  it('L4 · place la correction du tri juste après le tri', () => {
    const rangDuTri = COURS.ecrans.findIndex(({ id }) => id === TRI);

    expect(COURS.ecrans[rangDuTri + 1]?.id).toBe(CORRECTION);
  });

  it('RET-18 · fait suivre le mini-jeu comparable de sa correction, comme le tri de l’acte 1', () => {
    const rangDuJeu = COURS.ecrans.findIndex(({ id }) => id === JEU);
    const correction = COURS.ecrans[rangDuJeu + 1];
    const presentation =
      correction?.brique === 'fp-story'
        ? correction.proprietes.presentation
        : undefined;

    expect(correction?.diffusion).toBe('seance');
    expect(presentation?.version === 2 && presentation.renderer).toBe(
      'sort-review',
    );
    expect(
      presentation?.version === 2 &&
        presentation.renderer === 'sort-review' &&
        presentation.props.source,
    ).toEqual({
      screenId: JEU,
      sortId: 'b2-01-a2-comparable',
    });
  });

  it('RET-25 · ouvre chaque exemple travaillé sans aucune correction révélée', () => {
    const exemples = COURS.ecrans.filter(
      (candidat) => candidat.brique === 'fp-worked',
    );

    expect(exemples.length).toBeGreaterThan(0);
    expect(
      exemples.map((exemple) =>
        exemple.brique === 'fp-worked' ? exemple.proprietes.etayage : null,
      ),
    ).toEqual(exemples.map(() => 0));
  });

  it('RET-23 · pose à chaque étape d’exemple travaillé une question à laquelle répondre', () => {
    const invites = COURS.ecrans.flatMap((candidat) =>
      candidat.brique === 'fp-worked'
        ? candidat.proprietes.exemple.etapes.map(({ invite }) => invite)
        : [],
    );

    expect(invites.length).toBeGreaterThan(0);
    expect(invites.filter((invite) => !invite.trim().endsWith('?'))).toEqual(
      [],
    );
  });

  it('RET-21 · trace la machine à coefficients du départ à l’arrivée en passant par la valeur après le premier taux', () => {
    const machine = ecran(MACHINE);

    expect(
      machine.brique === 'fp-concept4' && machine.proprietes.etapes,
    ).toEqual([
      { libelle: 'Départ', calcul: 'depart' },
      { libelle: 'Après t₁', calcul: 'depart * (1 + tauxUn / 100)' },
      {
        libelle: 'Arrivée',
        calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)',
      },
    ]);
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
