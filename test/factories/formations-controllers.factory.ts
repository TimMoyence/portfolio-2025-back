import { PublicFormProtectionService } from '../../src/common/interfaces/security/public-form-protection.service';
import { FormationsParticipantsController } from '../../src/modules/formations/interfaces/FormationsParticipants.controller';
import { FormationsStudentController } from '../../src/modules/formations/interfaces/FormationsStudent.controller';

export function createMockFormationsParticipantsDependances() {
  return {
    participants: { execute: jest.fn() },
    evincerParticipant: { execute: jest.fn() },
    readmettreParticipant: { execute: jest.fn() },
  };
}

export function buildFormationsParticipantsController(
  dependances: ReturnType<typeof createMockFormationsParticipantsDependances>,
): FormationsParticipantsController {
  return new FormationsParticipantsController(
    dependances.participants as never,
    dependances.evincerParticipant as never,
    dependances.readmettreParticipant as never,
  );
}

export function createMockFormationsStudentDependances() {
  return {
    joinSession: { execute: jest.fn() },
    submitAnswer: { execute: jest.fn() },
    submitProduction: { execute: jest.fn() },
    tenterEnigme: { execute: jest.fn() },
    declarerJalon: { execute: jest.fn() },
    defis: { tenter: jest.fn(), strategies: jest.fn() },
    lireEtatParticipant: { execute: jest.fn() },
    lireRappels: { execute: jest.fn() },
    recordIncidents: { execute: jest.fn() },
    streamSession: { execute: jest.fn() },
    dueQuestions: { execute: jest.fn() },
    lireSujet: { execute: jest.fn() },
    saveFreeResponse: { execute: jest.fn() },
    tokens: { sign: jest.fn(), verify: jest.fn() },
    clesEtudiants: { de: jest.fn().mockReturnValue('cle-etudiant') },
    codeScan: { assertPasDeBalayage: jest.fn(), enregistrerEchec: jest.fn() },
  };
}

type DependancesFormationsStudent = ReturnType<
  typeof createMockFormationsStudentDependances
>;

export function buildFormationsStudentController(
  dependances: DependancesFormationsStudent,
): FormationsStudentController {
  return new FormationsStudentController(
    dependances.joinSession as never,
    dependances.submitAnswer as never,
    dependances.submitProduction as never,
    dependances.tenterEnigme as never,
    dependances.declarerJalon as never,
    dependances.defis as never,
    dependances.lireEtatParticipant as never,
    dependances.lireRappels as never,
    dependances.recordIncidents as never,
    dependances.streamSession as never,
    dependances.dueQuestions as never,
    dependances.lireSujet as never,
    dependances.saveFreeResponse as never,
    dependances.tokens as never,
    dependances.clesEtudiants as never,
    dependances.codeScan as never,
    new PublicFormProtectionService(),
  );
}
