import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { Request } from 'express';
import { of } from 'rxjs';
import { PublicFormProtectionService } from '../../../../common/interfaces/security/public-form-protection.service';
import {
  InvalidSessionCodeError,
  SeedPoolExhaustedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { FormationsStudentController } from '../FormationsStudent.controller';
import { ParticipantTokenGuard } from '../ParticipantToken.guard';
import type { JoinSessionRequestDto } from '../dto/join-session.request.dto';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const PARTICIPANT_ID = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const JETON = `${PARTICIPANT_ID}.empreinte`;
const IP_SALLE = 'sortie-nat-salle-b204';

const requeteEtudiant = { ip: IP_SALLE, socket: {} } as unknown as Request;

function requeteVerifiee(participantId: string): Request {
  return { ...requeteEtudiant, participantId } as Request;
}

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
  const dueQuestions = { execute: jest.fn() };
  const lireSujet = { execute: jest.fn() };
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
    dueQuestions as never,
    lireSujet as never,
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

  it('inscrit l etudiant et lui rend un jeton lie a sa session, sans la graine de son tirage', async () => {
    const reponse = await rejoindre();

    expect(joinSession.execute).toHaveBeenCalledWith({
      code: '4271',
      studentKey: inscription.studentKey,
      prenom: 'Theo',
      nom: 'Martin',
      email: 'theo@example.com',
    });
    expect(tokens.sign).toHaveBeenCalledWith(SESSION_ID, PARTICIPANT_ID);
    expect(reponse).toEqual({
      participantId: PARTICIPANT_ID,
      sessionId: SESSION_ID,
      ecranCourant: 0,
      modeRythme: 'pilote',
      jeton: JETON,
    });
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
      libelleConfusion: 'Confondre interet simple et interet compose',
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
      libelleConfusion: 'Confondre interet simple et interet compose',
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

  it('branche le flux temps reel sur la session demandee, au nom du participant verifie par la garde', () => {
    const flux = of({ data: { etat: 'en_cours' } });
    streamSession.execute.mockReturnValue(flux);

    expect(controller.stream(SESSION_ID, requeteVerifiee(PARTICIPANT_ID))).toBe(
      flux,
    );
    expect(streamSession.execute).toHaveBeenCalledWith(
      SESSION_ID,
      PARTICIPANT_ID,
    );
    expect(tokens.verify).not.toHaveBeenCalled();
  });

  it('confie le controle du jeton a une garde, seule a pouvoir refuser avant l ouverture du flux', () => {
    const descripteur = Object.getOwnPropertyDescriptor(
      FormationsStudentController.prototype,
      'stream',
    );
    const gardes = Reflect.getMetadata(
      GUARDS_METADATA,
      descripteur?.value as object,
    ) as unknown[];

    expect(gardes).toContain(ParticipantTokenGuard);
  });

  it('demande les questions a revoir pour le porteur du jeton, jamais pour un autre', async () => {
    const dues = [
      { questionId: 'Q-CAP-03', concept: 'capitalisation', boite: 1 },
    ];
    dueQuestions.execute.mockResolvedValue(dues);

    const reponse = await controller.questionsDues(SESSION_ID, JETON);

    expect(tokens.verify).toHaveBeenCalledWith(SESSION_ID, JETON);
    expect(dueQuestions.execute).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      participantId: PARTICIPANT_ID,
    });
    expect(reponse).toEqual({ questions: dues });
  });

  it('ne rend aucune question a revoir quand le jeton est refuse', async () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(
      controller.questionsDues(SESSION_ID, 'jeton-force'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(dueQuestions.execute).not.toHaveBeenCalled();
  });

  it('sert le sujet du tirage au porteur du jeton, jamais a un autre', async () => {
    const sujet = { id: 'cours-de-test', ecrans: [] };
    lireSujet.execute.mockResolvedValue(sujet);

    const reponse = await controller.sujet(SESSION_ID, JETON);

    expect(tokens.verify).toHaveBeenCalledWith(SESSION_ID, JETON);
    expect(lireSujet.execute).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      participantId: PARTICIPANT_ID,
    });
    expect(reponse).toBe(sujet);
  });

  it('ne sert aucun sujet quand le jeton est refuse', async () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(
      controller.sujet(SESSION_ID, 'jeton-force'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(lireSujet.execute).not.toHaveBeenCalled();
  });

  it('confie le controle du jeton a une garde avant de servir le sujet', () => {
    const descripteur = Object.getOwnPropertyDescriptor(
      FormationsStudentController.prototype,
      'sujet',
    );
    const gardes = Reflect.getMetadata(
      GUARDS_METADATA,
      descripteur?.value as object,
    ) as unknown[];

    expect(gardes).toContain(ParticipantTokenGuard);
  });
});
