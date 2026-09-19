/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { questionsDuCours } from '../../domain/cours/Cours';
import { NOMBRE_TIRAGES_DISTRIBUES } from '../../domain/cours/OuvertureTirages';
import {
  CoursInconnuError,
  SessionCodeAlreadyActiveError,
} from '../../domain/errors/FormationErrors';
import { OpenSessionUseCase } from '../OpenSession.useCase';

const MAX_TENTATIVES_CODE = 20;
const COURS = buildCoursDeTest();
const COMMANDE = { courseSlug: COURS.slug, teacherId: 'teacher-uuid' };

describe('OpenSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: OpenSessionUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sut = new OpenSessionUseCase(sessions, creerCatalogueDeTest());
  });

  it('refuse un cours absent du catalogue sans ouvrir de session', async () => {
    const ouverture = sut.execute({ ...COMMANDE, courseSlug: 'inconnu' });

    await expect(ouverture).rejects.toBeInstanceOf(CoursInconnuError);
    await expect(ouverture).rejects.toThrow('Cours introuvable: inconnu');
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('tire le bareme du cours et le depose avec la session', async () => {
    await sut.execute(COMMANDE);

    expect(sessions.create).toHaveBeenCalledTimes(1);
    const [depot] = sessions.create.mock.calls[0];
    const graines = depot.bareme.tirages.map((tirage) => tirage.seed);
    expect(depot).toMatchObject(COMMANDE);
    expect(depot.courseVersion).toBe(1);
    expect(depot.bareme.tirages).toHaveLength(NOMBRE_TIRAGES_DISTRIBUES);
    expect(graines).not.toContain(depot.bareme.graineReference);
    expect(depot.bareme.questions.map((question) => question.id)).toEqual(
      questionsDuCours(COURS).map((question) => question.id),
    );
  });

  it('couvre toutes les questions du cours dans chacun des soixante tirages', async () => {
    await sut.execute(COMMANDE);

    const [depot] = sessions.create.mock.calls[0];
    const attendues = questionsDuCours(COURS)
      .map((question) => question.id)
      .sort((a, b) => a.localeCompare(b));
    const incomplets = depot.bareme.tirages.filter(
      (tirage) =>
        Object.keys(tirage.solutions)
          .sort((a, b) => a.localeCompare(b))
          .join() !== attendues.join(),
    );
    expect(depot.bareme.tirages).toHaveLength(NOMBRE_TIRAGES_DISTRIBUES);
    expect(incomplets).toEqual([]);
  });

  it('ouvre une session et retourne son code', async () => {
    sessions.create.mockResolvedValue(buildSessionRecord({ code: '4271' }));
    const result = await sut.execute(COMMANDE);
    expect(result.code).toBe('4271');
    expect(result.sessionId).toBe('session-uuid');
  });

  it('regenere un code tant qu il est deja pris', async () => {
    sessions.isCodeTaken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await sut.execute(COMMANDE);
    expect(sessions.isCodeTaken).toHaveBeenCalledTimes(3);
  });

  it('retire un autre code quand la creation entre en conflit', async () => {
    sessions.create
      .mockRejectedValueOnce(new SessionCodeAlreadyActiveError('4271'))
      .mockResolvedValue(buildSessionRecord({ code: '5382' }));
    const result = await sut.execute(COMMANDE);
    expect(result.code).toBe('5382');
    expect(sessions.create).toHaveBeenCalledTimes(2);
  });

  it('laisse remonter une erreur de creation qui n est pas un conflit de code', async () => {
    sessions.create.mockRejectedValue(new Error('panne du depot'));
    await expect(sut.execute(COMMANDE)).rejects.toThrow('panne du depot');
    expect(sessions.create).toHaveBeenCalledTimes(1);
  });

  it('abandonne apres vingt conflits de code consecutifs', async () => {
    sessions.create.mockRejectedValue(
      new SessionCodeAlreadyActiveError('4271'),
    );
    await expect(sut.execute(COMMANDE)).rejects.toThrow(DomainValidationError);
    expect(sessions.create).toHaveBeenCalledTimes(MAX_TENTATIVES_CODE);
  });

  it('refuse d ouvrir une session quand le code reste toujours pris', async () => {
    sessions.isCodeTaken.mockResolvedValue(true);
    await expect(sut.execute(COMMANDE)).rejects.toThrow(DomainValidationError);
    expect(sessions.isCodeTaken).toHaveBeenCalledTimes(MAX_TENTATIVES_CODE);
  });
});
