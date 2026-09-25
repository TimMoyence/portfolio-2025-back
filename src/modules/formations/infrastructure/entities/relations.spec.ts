import { getMetadataArgsStorage } from 'typeorm';
import { FormationAnswerEntity } from './FormationAnswer.entity';
import { FormationCourseContentEntity } from './FormationCourseContent.entity';
import { FormationEscapeAttemptEntity } from './FormationEscapeAttempt.entity';
import { FormationEscapeProgressEntity } from './FormationEscapeProgress.entity';
import { FormationFreeResponseEntity } from './FormationFreeResponse.entity';
import { FormationIncidentEntity } from './FormationIncident.entity';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationRappelServiEntity } from './FormationRappelServi.entity';
import { FormationScoreEntity } from './FormationScore.entity';
import { FormationScreenContentEntity } from './FormationScreenContent.entity';
import { FormationSessionEntity } from './FormationSession.entity';
import { FormationTeacherAnnotationEntity } from './FormationTeacherAnnotation.entity';

type Cible = () => unknown;
type Entite = new () => object;

interface RelationAttendue {
  readonly depuis: Entite;
  readonly propriete: string;
  readonly vers: Entite;
  readonly contrainte: string;
  readonly suppression: 'CASCADE';
}

const cascade = (
  depuis: Entite,
  propriete: string,
  vers: Entite,
  contrainte: string,
): RelationAttendue => ({
  depuis,
  propriete,
  vers,
  contrainte,
  suppression: 'CASCADE',
});

const ATTENDUES: readonly RelationAttendue[] = [
  cascade(
    FormationParticipantEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_participants_session',
  ),
  cascade(
    FormationAnswerEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_answers_session',
  ),
  cascade(
    FormationAnswerEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_answers_participant',
  ),
  cascade(
    FormationIncidentEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_incidents_participant',
  ),
  cascade(
    FormationScoreEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_scores_session',
  ),
  cascade(
    FormationScoreEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_scores_participant',
  ),
  cascade(
    FormationFreeResponseEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_free_responses_session',
  ),
  cascade(
    FormationFreeResponseEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_free_responses_participant',
  ),
  cascade(
    FormationTeacherAnnotationEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_teacher_annotations_session',
  ),
  cascade(
    FormationScreenContentEntity,
    'course',
    FormationCourseContentEntity,
    'FK_formation_screen_contents_course',
  ),
  cascade(
    FormationEscapeAttemptEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_escape_attempts_session',
  ),
  cascade(
    FormationEscapeAttemptEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_escape_attempts_participant',
  ),
  cascade(
    FormationEscapeProgressEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_escape_progress_session',
  ),
  cascade(
    FormationEscapeProgressEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_escape_progress_participant',
  ),
  cascade(
    FormationRappelServiEntity,
    'session',
    FormationSessionEntity,
    'FK_formation_rappels_servis_session',
  ),
  cascade(
    FormationRappelServiEntity,
    'participant',
    FormationParticipantEntity,
    'FK_formation_rappels_servis_participant',
  ),
];

const declareePour = (cible: unknown, entite: Entite): boolean =>
  cible === entite ||
  (typeof cible === 'function' && entite.prototype instanceof cible);

describe('relations des entites formations', () => {
  const relations = getMetadataArgsStorage().relations;
  const jointures = getMetadataArgsStorage().joinColumns;

  it('declare les seize clefs etrangeres des migrations', () => {
    expect(ATTENDUES).toHaveLength(16);
  });

  for (const attendue of ATTENDUES) {
    describe(`${attendue.depuis.name}.${attendue.propriete}`, () => {
      const relation = relations.find(
        (candidate) =>
          declareePour(candidate.target, attendue.depuis) &&
          candidate.propertyName === attendue.propriete,
      );

      it('pointe vers l entite attendue', () => {
        expect(relation).toBeDefined();
        expect((relation!.type as Cible)()).toBe(attendue.vers);
      });

      it('applique a la ligne fille la regle de suppression de la migration', () => {
        expect(relation!.options.onDelete).toBe(attendue.suppression);
      });

      it('porte le nom de contrainte de la migration', () => {
        const jointure = jointures.find(
          (candidate) =>
            declareePour(candidate.target, attendue.depuis) &&
            candidate.propertyName === attendue.propriete,
        );
        expect(jointure?.foreignKeyConstraintName).toBe(attendue.contrainte);
      });
    });
  }
});
