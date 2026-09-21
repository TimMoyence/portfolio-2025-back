import { Inject, Injectable } from '@nestjs/common';
import { assertEcranServi } from '../domain/cours/EcranServi';
import {
  corrigerEnigme,
  ecranDEnigmes,
  enigmeOuverte,
  enigmeVisee,
} from '../domain/cours/Enigmes';
import type { ProgressionDEnigme } from '../domain/cours/Enigmes';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import {
  AnswerAlreadySubmittedError,
  CoursInconnuError,
  EnigmeDejaResolueError,
  EnigmeInconnueError,
  EnigmeVerrouilleeError,
  ParticipantNotFoundError,
  SessionNotFoundError,
  TentativesEpuiseesError,
} from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IEscapeRepository } from '../domain/IEscape.repository';
import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import {
  ANSWERS_REPOSITORY,
  CATALOGUE_COURS,
  ESCAPE_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface TenterEnigmeCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly reponse: string;
  readonly dureeMs: number;
}

export interface TenterEnigmeResult {
  correcte: boolean;
  fragment: string | null;
  tentativesRestantes: number;
}

@Injectable()
export class TenterEnigmeUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(ESCAPE_REPOSITORY)
    private readonly escape: IEscapeRepository,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(command: TenterEnigmeCommand): Promise<TenterEnigmeResult> {
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);

    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    const cible = ecranDEnigmes(cours, command.parcoursId);
    if (cible === null) {
      throw new EnigmeInconnueError(command.parcoursId, command.enigmeId);
    }
    assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);

    const visee = enigmeVisee(cible, command.enigmeId);
    if (visee === null) {
      throw new EnigmeInconnueError(command.parcoursId, command.enigmeId);
    }
    const participant = await this.participants.findById(command.participantId);
    if (
      !participant ||
      participant.sessionId !== command.sessionId ||
      participant.evinceLe !== null
    ) {
      throw new ParticipantNotFoundError(command.participantId);
    }

    const progression = await this.lireProgression(command);
    if (!enigmeOuverte(cible, progression, visee.rangEnigme)) {
      throw new EnigmeVerrouilleeError(command.enigmeId);
    }
    const etat = progression.find(
      (entree) => entree.enigmeId === command.enigmeId,
    );
    if (etat?.resolue === true) {
      throw new EnigmeDejaResolueError(command.enigmeId);
    }

    const verdict = corrigerEnigme(visee.corrige, command.reponse);
    const dejaFaite = await this.escape.tentativeDejaFaite(
      command.participantId,
      command.enigmeId,
      verdict.valeurNormalisee,
      command.reponse,
    );
    const tentatives = dejaFaite
      ? (etat?.tentatives ?? 0)
      : await this.consommerUneTentative(command, cible.tentativesMax);

    await this.escape.journaliser({
      sessionId: command.sessionId,
      participantId: command.participantId,
      enigmeId: command.enigmeId,
      valeurNormalisee: verdict.valeurNormalisee,
      saisie: command.reponse,
      correcte: verdict.correcte,
    });
    await this.enregistrerPremiereTentative(command, participant.seed, {
      concept: visee.question.concept,
      correcte: verdict.correcte,
      confusion: verdict.confusion,
      studentKey: participant.studentKey,
    });
    if (verdict.correcte) {
      await this.escape.marquerResolue(command.participantId, command.enigmeId);
    }
    this.cache.signalerActivite(command.sessionId);

    return {
      correcte: verdict.correcte,
      fragment: verdict.correcte ? visee.corrige.fragment : null,
      tentativesRestantes: Math.max(0, cible.tentativesMax - tentatives),
    };
  }

  private async consommerUneTentative(
    command: TenterEnigmeCommand,
    plafond: number,
  ): Promise<number> {
    const tentatives = await this.escape.incrementerTentative({
      sessionId: command.sessionId,
      participantId: command.participantId,
      parcoursId: command.parcoursId,
      enigmeId: command.enigmeId,
      plafond,
    });
    if (tentatives === null) {
      throw new TentativesEpuiseesError(command.enigmeId);
    }
    return tentatives;
  }

  private async lireProgression(
    command: TenterEnigmeCommand,
  ): Promise<readonly ProgressionDEnigme[]> {
    const lignes = await this.escape.listerProgression(
      command.participantId,
      command.parcoursId,
    );
    return lignes.map((ligne) => ({
      enigmeId: ligne.enigmeId,
      tentatives: ligne.tentatives,
      resolue: ligne.resolueLe !== null,
    }));
  }

  private async enregistrerPremiereTentative(
    command: TenterEnigmeCommand,
    seed: number,
    question: {
      concept: string;
      correcte: boolean;
      confusion: string | null;
      studentKey: string;
    },
  ): Promise<void> {
    if (await this.answers.existsFor(command.participantId, command.enigmeId)) {
      return;
    }
    try {
      await this.answers.create({
        sessionId: command.sessionId,
        participantId: command.participantId,
        questionId: command.enigmeId,
        concept: question.concept,
        valeur: command.reponse,
        seed,
        correcte: question.correcte,
        misconception: question.confusion,
        dureeMs: command.dureeMs,
      });
    } catch (erreur) {
      if (erreur instanceof AnswerAlreadySubmittedError) {
        return;
      }
      throw erreur;
    }
    await this.mastery.enregistrerTentative({
      studentKey: question.studentKey,
      concept: question.concept,
      reussi: question.correcte,
      vueLe: new Date(),
    });
  }
}
