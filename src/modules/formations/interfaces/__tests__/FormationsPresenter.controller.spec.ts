import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { of } from 'rxjs';
import type { DerouleCours } from '../../domain/cours/DeroulePresentateur';
import type { RapportSession } from '../../domain/IFormationMailer.port';
import { FormationsPresenterController } from '../FormationsPresenter.controller';
import type { ControlSessionRequestDto } from '../dto/control-session.request.dto';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const TEACHER_ID = 'f1e2d3c4-b5a6-4978-8899-aabbccddeeff';

const requeteFormateur = {
  user: { sub: TEACHER_ID },
  once: jest.fn(),
} as unknown as Request;

describe('FormationsPresenterController', () => {
  const openSession = { execute: jest.fn() };
  const controlSession = {
    start: jest.fn(),
    apply: jest.fn(),
  };
  const closeSession = { execute: jest.fn() };
  const results = { execute: jest.fn() };
  const streamSession = { executeForTeacher: jest.fn() };
  const lireDeroule = { execute: jest.fn() };

  const controller = new FormationsPresenterController(
    openSession as never,
    controlSession as never,
    closeSession as never,
    results as never,
    streamSession as never,
    lireDeroule as never,
  );

  const controle = (dto: ControlSessionRequestDto): Promise<void> =>
    controller.control(SESSION_ID, dto, requeteFormateur);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ouvre une session par le seul slug du cours au nom du formateur authentifie', async () => {
    openSession.execute.mockResolvedValue({
      sessionId: SESSION_ID,
      code: '4271',
    });

    const reponse = await controller.open(
      { courseSlug: 'cours-de-test' },
      requeteFormateur,
    );

    expect(openSession.execute).toHaveBeenCalledWith({
      courseSlug: 'cours-de-test',
      teacherId: TEACHER_ID,
    });
    expect(openSession.execute.mock.calls[0][0]).not.toHaveProperty('bareme');
    expect(reponse).toEqual({ sessionId: SESSION_ID, code: '4271' });
  });

  it('demarre la session en transmettant l identifiant de l appelant', async () => {
    await controller.start(SESSION_ID, requeteFormateur);

    expect(controlSession.start).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID);
  });

  it('change l ecran courant', async () => {
    await controle({ ecran: 4 });

    expect(controlSession.apply).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID, {
      ecran: 4,
      mode: undefined,
      intervalle: null,
    });
  });

  it('passe en rythme libre avec son intervalle', async () => {
    await controle({ mode: 'libre', intervalle: { premier: 3, dernier: 9 } });

    expect(controlSession.apply).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID, {
      ecran: undefined,
      mode: 'libre',
      intervalle: { premier: 3, dernier: 9 },
    });
  });

  it('repasse en rythme pilote sans intervalle', async () => {
    await controle({ mode: 'pilote' });

    expect(controlSession.apply).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID, {
      ecran: undefined,
      mode: 'pilote',
      intervalle: null,
    });
  });

  it('confie l ecran et le rythme a un seul appel quand les deux sont demandes', async () => {
    await controle({ ecran: 2, mode: 'pilote' });

    expect(controlSession.apply).toHaveBeenCalledTimes(1);
    expect(controlSession.apply).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID, {
      ecran: 2,
      mode: 'pilote',
      intervalle: null,
    });
  });

  it('refuse une demande de pilotage vide sans toucher a la session', async () => {
    await expect(controle({})).rejects.toBeInstanceOf(BadRequestException);

    expect(controlSession.apply).not.toHaveBeenCalled();
  });

  it('cloture sans deriver de destinataire de l identite du formateur', async () => {
    await controller.close(SESSION_ID, requeteFormateur);

    expect(closeSession.execute).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID);
    expect(closeSession.execute.mock.calls[0]).toHaveLength(2);
  });

  it('ouvre le flux presentateur au nom de l appelant, jamais sans lui', async () => {
    const flux = of({ data: { etat: 'en_cours' } });
    streamSession.executeForTeacher.mockResolvedValue(flux);

    await expect(
      controller.presenterStream(SESSION_ID, requeteFormateur),
    ).resolves.toBe(flux);
    expect(streamSession.executeForTeacher).toHaveBeenCalledWith(
      SESSION_ID,
      TEACHER_ID,
    );
  });

  it('rend le rapport de session au formateur proprietaire', async () => {
    const rapport = {
      code: '4271',
      participants: [],
    } as unknown as RapportSession;
    results.execute.mockResolvedValue(rapport);

    await expect(
      controller.getResults(SESSION_ID, requeteFormateur),
    ).resolves.toBe(rapport);
    expect(results.execute).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID);
  });

  it('exporte le bilan JSON en reutilisant le rapport protege', async () => {
    const rapport = {
      code: '4271',
      participants: [],
    } as unknown as RapportSession;
    results.execute.mockResolvedValue(rapport);

    await expect(
      controller.exportReport(SESSION_ID, requeteFormateur),
    ).resolves.toBe(rapport);
    expect(results.execute).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID);
  });

  it('rend le deroule annote au formateur proprietaire', async () => {
    const deroule = { id: 'cours-de-test' } as unknown as DerouleCours;
    lireDeroule.execute.mockResolvedValue(deroule);

    await expect(
      controller.getDeroule(SESSION_ID, requeteFormateur),
    ).resolves.toBe(deroule);
    expect(lireDeroule.execute).toHaveBeenCalledWith(SESSION_ID, TEACHER_ID);
  });
});
