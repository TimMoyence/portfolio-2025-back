import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { PublicFormProtectionService } from '../../../../common/interfaces/security/public-form-protection.service';
import { FormationsStudentController } from '../FormationsStudent.controller';
import type { JoinSessionRequestDto } from '../dto/join-session.request.dto';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const PARTICIPANT_ID = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const JETON = `${PARTICIPANT_ID}.empreinte`;

const inscription: JoinSessionRequestDto = {
  studentKey: '11111111-1111-4111-8111-111111111111',
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo@example.com',
};

describe('FormationsStudentController', () => {
  const joinSession = { execute: jest.fn() };
  const submitAnswer = { execute: jest.fn() };
  const recordIncidents = { execute: jest.fn() };
  const streamSession = { execute: jest.fn() };
  const tokens = { sign: jest.fn(), verify: jest.fn() };

  const controller = new FormationsStudentController(
    joinSession as never,
    submitAnswer as never,
    recordIncidents as never,
    streamSession as never,
    tokens as never,
    new PublicFormProtectionService(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    joinSession.execute.mockResolvedValue({
      participantId: PARTICIPANT_ID,
      sessionId: SESSION_ID,
      seed: 7,
      ecranCourant: 0,
      modeRythme: 'pilote',
    });
    tokens.sign.mockReturnValue(JETON);
    tokens.verify.mockReturnValue(PARTICIPANT_ID);
  });

  it('inscrit l etudiant et lui rend un jeton lie a sa session', async () => {
    const reponse = await controller.join('4271', inscription);

    expect(joinSession.execute).toHaveBeenCalledWith({
      code: '4271',
      studentKey: inscription.studentKey,
      prenom: 'Theo',
      nom: 'Martin',
      email: 'theo@example.com',
    });
    expect(tokens.sign).toHaveBeenCalledWith(SESSION_ID, PARTICIPANT_ID);
    expect(reponse.jeton).toBe(JETON);
    expect(reponse.seed).toBe(7);
  });

  it('arrete le robot qui remplit le champ piege avant tout appel metier', async () => {
    await expect(
      controller.join('4271', { ...inscription, website: 'https://spam' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(joinSession.execute).not.toHaveBeenCalled();
  });

  it('corrige la reponse cote serveur et ne rend que le verdict', async () => {
    submitAnswer.execute.mockResolvedValue({
      correcte: false,
      misconception: 'interet-simple',
      solution: 1338,
    });

    const reponse = await controller.answer(SESSION_ID, JETON, {
      questionId: 'Q-CAP-03',
      valeur: 1300,
      dureeMs: 42000,
    });

    expect(tokens.verify).toHaveBeenCalledWith(SESSION_ID, JETON);
    expect(submitAnswer.execute).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      participantId: PARTICIPANT_ID,
      questionId: 'Q-CAP-03',
      valeur: 1300,
      dureeMs: 42000,
    });
    expect(reponse).toEqual({
      correcte: false,
      misconception: 'interet-simple',
    });
  });

  it('ne corrige rien quand le jeton est refuse', async () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(
      controller.answer(SESSION_ID, undefined, {
        questionId: 'Q-CAP-03',
        valeur: 1300,
        dureeMs: 42000,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(submitAnswer.execute).not.toHaveBeenCalled();
  });

  it('rattache les incidents a la session de l URL et au porteur du jeton', async () => {
    const horodatage = new Date('2026-09-11T10:00:00.000Z');

    await controller.incidents(SESSION_ID, JETON, {
      incidents: [
        { type: 'tab_hidden', horodatage },
        { type: 'copy_attempt', contexte: { cible: 'enonce' }, horodatage },
      ],
    });

    expect(recordIncidents.execute).toHaveBeenCalledWith([
      {
        sessionId: SESSION_ID,
        participantId: PARTICIPANT_ID,
        type: 'tab_hidden',
        contexte: null,
        horodatage,
      },
      {
        sessionId: SESSION_ID,
        participantId: PARTICIPANT_ID,
        type: 'copy_attempt',
        contexte: { cible: 'enonce' },
        horodatage,
      },
    ]);
  });

  it('n enregistre aucun incident quand le jeton est refuse', async () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(
      controller.incidents(SESSION_ID, 'jeton-force', { incidents: [] }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(recordIncidents.execute).not.toHaveBeenCalled();
  });

  it('branche le flux temps reel sur la session demandee', () => {
    const flux = of({ data: { etat: 'en_cours' } });
    streamSession.execute.mockReturnValue(flux);

    expect(controller.stream(SESSION_ID)).toBe(flux);
    expect(streamSession.execute).toHaveBeenCalledWith(SESSION_ID);
  });
});
