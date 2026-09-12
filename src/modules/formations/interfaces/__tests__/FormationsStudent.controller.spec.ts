import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { of } from 'rxjs';
import { PublicFormProtectionService } from '../../../../common/interfaces/security/public-form-protection.service';
import {
  InvalidSessionCodeError,
  SeedPoolExhaustedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { FormationsStudentController } from '../FormationsStudent.controller';
import type { JoinSessionRequestDto } from '../dto/join-session.request.dto';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const PARTICIPANT_ID = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const JETON = `${PARTICIPANT_ID}.empreinte`;
const IP_SALLE = 'sortie-nat-salle-b204';

const requeteEtudiant = { ip: IP_SALLE, socket: {} } as unknown as Request;

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
  const codeScan = {
    assertPasDeBalayage: jest.fn(),
    enregistrerEchec: jest.fn(),
  };

  const controller = new FormationsStudentController(
    joinSession as never,
    submitAnswer as never,
    recordIncidents as never,
    streamSession as never,
    tokens as never,
    codeScan as never,
    new PublicFormProtectionService(),
  );

  const rejoindre = (dto: JoinSessionRequestDto = inscription) =>
    controller.join('4271', dto, requeteEtudiant);

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
    const reponse = await rejoindre();

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
      rejoindre({ ...inscription, website: 'https://spam' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(joinSession.execute).not.toHaveBeenCalled();
  });

  it('ne compte aucun echec quand une classe entiere entre avec le bon code', async () => {
    await rejoindre();

    expect(codeScan.assertPasDeBalayage).toHaveBeenCalledWith(IP_SALLE);
    expect(codeScan.enregistrerEchec).not.toHaveBeenCalled();
  });

  it('compte l echec sur un code inconnu, pour garder le balayage borne par adresse', async () => {
    joinSession.execute.mockRejectedValue(new SessionNotFoundError('4271'));

    await expect(rejoindre()).rejects.toBeInstanceOf(SessionNotFoundError);

    expect(codeScan.enregistrerEchec).toHaveBeenCalledWith(IP_SALLE);
  });

  it('compte l echec sur un code hors format', async () => {
    joinSession.execute.mockRejectedValue(new InvalidSessionCodeError('42a1'));

    await expect(rejoindre()).rejects.toBeInstanceOf(InvalidSessionCodeError);

    expect(codeScan.enregistrerEchec).toHaveBeenCalledWith(IP_SALLE);
  });

  it('ne compte pas un echec qui ne revele rien sur l existence du code', async () => {
    joinSession.execute.mockRejectedValue(new SeedPoolExhaustedError());

    await expect(rejoindre()).rejects.toBeInstanceOf(SeedPoolExhaustedError);

    expect(codeScan.enregistrerEchec).not.toHaveBeenCalled();
  });

  it('refuse l inscription avant tout appel metier quand le balayage est detecte', async () => {
    codeScan.assertPasDeBalayage.mockImplementation(() => {
      throw new BadRequestException();
    });

    await expect(rejoindre()).rejects.toBeInstanceOf(BadRequestException);

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

    expect(controller.stream(SESSION_ID, JETON)).toBe(flux);
    expect(tokens.verify).toHaveBeenCalledWith(SESSION_ID, JETON);
    expect(streamSession.execute).toHaveBeenCalledWith(SESSION_ID);
  });

  it('n ouvre aucun flux a qui ne presente pas de jeton de participant', () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    expect(() => controller.stream(SESSION_ID, undefined)).toThrow(
      UnauthorizedException,
    );
    expect(streamSession.execute).not.toHaveBeenCalled();
  });
});
