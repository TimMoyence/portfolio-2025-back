/* eslint-disable @typescript-eslint/unbound-method */
import type { EnregistrementDeReponse } from '../../src/modules/formations/application/EnregistrementDeReponse';
import type { ICatalogueCours } from '../../src/modules/formations/domain/cours/ICatalogueCours.port';
import type { SessionRecord } from '../../src/modules/formations/domain/ISessions.repository';
import {
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../factories/formation.factory';
import {
  verifierGardesDeParticipant,
  verifierGardesDeSeance,
} from './gardes-de-seance';

export function creerDependancesDEnregistrement(seance: SessionRecord) {
  const dependances = {
    sessions: createMockSessionsRepo(),
    participants: createMockParticipantsRepo(),
    answers: createMockAnswersRepo(),
    mastery: createMockMasteryRepo(),
    cache: createMockSessionStateCache(),
  };
  dependances.sessions.findById.mockResolvedValue(seance);
  return dependances;
}

export type DependancesDEnregistrement = ReturnType<
  typeof creerDependancesDEnregistrement
>;

export function monterEnregistrement<U extends EnregistrementDeReponse>(
  UseCase: new (
    ...args: ConstructorParameters<typeof EnregistrementDeReponse>
  ) => U,
  dependances: DependancesDEnregistrement,
  catalogue: ICatalogueCours,
): U {
  return new UseCase(
    dependances.sessions,
    dependances.participants,
    dependances.answers,
    dependances.mastery,
    dependances.cache,
    catalogue,
  );
}

export interface ContexteDEnregistrement {
  readonly dependances: DependancesDEnregistrement;
  readonly courseSlug: string;
  readonly executer: () => Promise<unknown>;
}

export function verifierContratDEnregistrement(
  contexte: () => ContexteDEnregistrement,
): void {
  const effetsInterdits = () => {
    const { answers, mastery } = contexte().dependances;
    return [answers.create, mastery.enregistrerTentative];
  };

  verifierGardesDeSeance(() => ({
    sessions: contexte().dependances.sessions,
    courseSlug: contexte().courseSlug,
    executer: contexte().executer,
    effetsInterdits,
  }));

  verifierGardesDeParticipant(() => ({
    participants: contexte().dependances.participants,
    executer: contexte().executer,
    effetsInterdits,
  }));

  it('signale l activite de la seance une fois la reponse ecrite', async () => {
    const { dependances, executer } = contexte();

    await executer();

    expect(dependances.cache.signalerActivite).toHaveBeenCalledWith(
      'session-uuid',
    );
    expect(dependances.answers.create.mock.invocationCallOrder[0]).toBeLessThan(
      dependances.cache.signalerActivite.mock.invocationCallOrder[0],
    );
  });
}
