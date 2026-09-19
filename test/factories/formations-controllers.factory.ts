import { PublicFormProtectionService } from '../../src/common/interfaces/security/public-form-protection.service';
import { FormationsStudentController } from '../../src/modules/formations/interfaces/FormationsStudent.controller';

export function createMockFormationsStudentDependances() {
  return {
    joinSession: { execute: jest.fn() },
    submitAnswer: { execute: jest.fn() },
    recordIncidents: { execute: jest.fn() },
    streamSession: { execute: jest.fn() },
    dueQuestions: { execute: jest.fn() },
    lireSujet: { execute: jest.fn() },
    saveFreeResponse: { execute: jest.fn() },
    tokens: { sign: jest.fn(), verify: jest.fn() },
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
    dependances.recordIncidents as never,
    dependances.streamSession as never,
    dependances.dueQuestions as never,
    dependances.lireSujet as never,
    dependances.saveFreeResponse as never,
    dependances.tokens as never,
    dependances.codeScan as never,
    new PublicFormProtectionService(),
  );
}
