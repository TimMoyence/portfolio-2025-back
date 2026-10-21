import { Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { gradeAnswer } from '../domain/AnswerGrading';
import { estValeurConnue, findQuestion, solutionFor } from '../domain/Bareme';
import {
  absenteDuCours,
  assertCorrectionNonProjetee,
  cibleServie,
  ecranParId,
  idDeLEcranAuRang,
  rangDeLaQuestion,
  verdictServiDe,
} from '../domain/cours/EcranServi';
import { assertQuestionNonCorrigee } from '../domain/cours/CorrectionSurPlace';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import { lireNombreSaisi } from '../domain/cours/Formule';
import {
  AnswerAlreadySubmittedError,
  SaisieNonNumeriqueError,
} from '../domain/errors/FormationErrors';
import type { AnswerValue } from '../domain/GradingCore';
import { estNeSaitPas } from '../domain/ResultatsSeance';
import { EnregistrementDeReponse } from './EnregistrementDeReponse';
import type {
  SubmitAnswerCommand,
  SubmitAnswerResult,
} from './dto/SubmitAnswer.command';

const TYPES_A_ROUTE_PROPRE: readonly string[] = [
  'feuille',
  'tableau',
  'classement',
  'enigme',
];

function estUneSaisieNumerique(
  type: string,
  valeur: AnswerValue,
): valeur is string {
  return (
    type === 'numeric' && typeof valeur === 'string' && !estNeSaitPas(valeur)
  );
}

function nombreSaisi(questionId: string, saisie: string): number {
  const nombre = lireNombreSaisi(saisie);
  if (nombre === null) {
    throw new SaisieNonNumeriqueError(questionId);
  }
  return nombre;
}

@Injectable()
export class SubmitAnswerUseCase extends EnregistrementDeReponse {
  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResult> {
    const { session, cours } = await this.participation.ouverte(command);
    const participant = await this.participation.participant(command);

    const deja = await this.answers.existsFor(
      command.participantId,
      command.questionId,
    );
    if (deja) {
      throw new AnswerAlreadySubmittedError(command.questionId);
    }

    const question = findQuestion(session.bareme, command.questionId);
    if (!question) {
      throw new DomainValidationError(
        `Question absente du bareme: ${command.questionId}`,
      );
    }
    if (TYPES_A_ROUTE_PROPRE.includes(question.type)) {
      throw new DomainValidationError(
        `La question ${command.questionId} de type ${question.type} passe par sa propre route`,
      );
    }
    const rangEcran =
      'rangEcran' in question
        ? question.rangEcran
        : rangDeLaQuestion(cours, command.questionId);
    const ecranId =
      'ecranId' in question
        ? question.ecranId
        : idDeLEcranAuRang(cours, rangEcran, command.questionId);
    cibleServie(
      session,
      cours,
      { valeur: question, id: ecranId, rang: () => rangEcran },
      absenteDuCours('une question'),
    );
    assertPhaseOuverte(session.pilotageEcrans, {
      ...question,
      ecranId,
    });
    assertQuestionNonCorrigee(
      session.pilotageEcrans,
      ecranParId(cours, ecranId),
      command.questionId,
    );
    assertCorrectionNonProjetee(session, cours, ecranId);

    const solution = solutionFor(
      session.bareme,
      participant.seed,
      command.questionId,
    );
    if (!solution) {
      throw new DomainValidationError(
        `Aucune solution du tirage de ce participant pour ${command.questionId}`,
      );
    }

    if (
      question.type === 'vote' &&
      !estValeurConnue(solution, command.valeur)
    ) {
      throw new DomainValidationError(
        `Valeur hors des options connues pour ${command.questionId}`,
      );
    }

    const valeur = estUneSaisieNumerique(question.type, command.valeur)
      ? nombreSaisi(command.questionId, command.valeur)
      : command.valeur;
    const verdict = gradeAnswer(valeur, solution, question.tolerance);

    await this.enregistrerPremiereReponse(
      {
        sessionId: command.sessionId,
        participantId: command.participantId,
        questionId: command.questionId,
        concept: question.concept,
        valeur,
        seed: participant.seed,
        correcte: verdict.correcte,
        misconception: verdict.misconception,
        dureeMs: command.dureeMs,
      },
      participant.studentKey,
    );
    this.participation.signalerActivite(command.sessionId);

    return verdictServiDe(session, question, verdict);
  }
}
