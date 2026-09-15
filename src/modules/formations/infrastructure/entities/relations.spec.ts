import { getMetadataArgsStorage } from 'typeorm';
import { FormationAnswerEntity } from './FormationAnswer.entity';
import { FormationIncidentEntity } from './FormationIncident.entity';
import { FormationParticipantEntity } from './FormationParticipant.entity';
import { FormationSessionEntity } from './FormationSession.entity';

type Cible = () => unknown;
type Entite = new () => object;

const ATTENDUES: ReadonlyArray<{
  depuis: Entite;
  propriete: string;
  vers: Entite;
  contrainte: string;
}> = [
  {
    depuis: FormationParticipantEntity,
    propriete: 'session',
    vers: FormationSessionEntity,
    contrainte: 'FK_formation_participants_session',
  },
  {
    depuis: FormationAnswerEntity,
    propriete: 'session',
    vers: FormationSessionEntity,
    contrainte: 'FK_formation_answers_session',
  },
  {
    depuis: FormationAnswerEntity,
    propriete: 'participant',
    vers: FormationParticipantEntity,
    contrainte: 'FK_formation_answers_participant',
  },
  {
    depuis: FormationIncidentEntity,
    propriete: 'participant',
    vers: FormationParticipantEntity,
    contrainte: 'FK_formation_incidents_participant',
  },
];

describe('relations des entites formations', () => {
  const relations = getMetadataArgsStorage().relations;
  const jointures = getMetadataArgsStorage().joinColumns;

  it('declare les quatre clefs etrangeres attendues', () => {
    expect(ATTENDUES).toHaveLength(4);
  });

  for (const attendue of ATTENDUES) {
    describe(`${attendue.depuis.name}.${attendue.propriete}`, () => {
      const relation = relations.find(
        (candidate) =>
          candidate.target === attendue.depuis &&
          candidate.propertyName === attendue.propriete,
      );

      it('pointe vers l entite attendue', () => {
        expect(relation).toBeDefined();
        expect((relation!.type as Cible)()).toBe(attendue.vers);
      });

      it('efface la ligne fille quand la ligne mere disparait', () => {
        expect(relation!.options.onDelete).toBe('CASCADE');
      });

      it('porte le nom de contrainte de la migration', () => {
        const jointure = jointures.find(
          (candidate) =>
            candidate.target === attendue.depuis &&
            candidate.propertyName === attendue.propriete,
        );
        expect(jointure?.foreignKeyConstraintName).toBe(attendue.contrainte);
      });
    });
  }
});
