import { buildParticipantRecord } from '../../../../test/factories/formation.factory';
import { appartenanceDuParticipant } from './AppartenanceDuParticipant';

const SESSION = 'session-uuid';
const EVINCE_LE = new Date('2026-09-20T09:00:00.000Z');

describe('appartenanceDuParticipant', () => {
  it('admet le participant actif de la seance et le rend', () => {
    const participant = buildParticipantRecord({ sessionId: SESSION });

    expect(appartenanceDuParticipant(participant, SESSION)).toEqual({
      participant,
      exclusion: null,
    });
  });

  it('admet le participant dont le jeton porte la generation courante', () => {
    const participant = buildParticipantRecord({ generationDeJeton: 2 });

    expect(
      appartenanceDuParticipant(participant, SESSION, 2).exclusion,
    ).toBeNull();
  });

  it.each([
    ['inconnu', null],
    ['inscrit a une autre seance', buildParticipantRecord({ sessionId: 'x' })],
    [
      'evince d une autre seance',
      buildParticipantRecord({ sessionId: 'x', evinceLe: EVINCE_LE }),
    ],
  ])('declare absent le participant %s', (_cas, participant) => {
    expect(appartenanceDuParticipant(participant, SESSION, 0)).toEqual({
      exclusion: 'absent',
    });
  });

  it('declare evince le participant de la seance que le formateur a evince', () => {
    const participant = buildParticipantRecord({ evinceLe: EVINCE_LE });

    expect(appartenanceDuParticipant(participant, SESSION, 0)).toEqual({
      exclusion: 'evince',
    });
  });

  it.each([
    ['actif', null],
    ['evince', EVINCE_LE],
  ])(
    'declare revoque le jeton d une generation passee, participant %s',
    (_cas, evinceLe) => {
      const participant = buildParticipantRecord({
        evinceLe,
        generationDeJeton: 1,
      });

      expect(appartenanceDuParticipant(participant, SESSION, 0)).toEqual({
        exclusion: 'revoque',
      });
    },
  );

  it('ne juge pas la generation quand l appelant n en presente aucune', () => {
    const participant = buildParticipantRecord({ generationDeJeton: 5 });

    expect(
      appartenanceDuParticipant(participant, SESSION).exclusion,
    ).toBeNull();
  });
});
