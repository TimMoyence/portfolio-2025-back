import { Inject, Injectable } from '@nestjs/common';
import {
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type {
  IMasteryRepository,
  MasteryRecord,
} from '../domain/IMastery.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { Boite } from '../domain/LeitnerBox';
import { isDue } from '../domain/LeitnerBox';
import {
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface DueQuestionsQuery {
  sessionId: string;
  participantId: string;
}

export interface DueQuestion {
  questionId: string;
  concept: string;
  boite: Boite;
}

@Injectable()
export class DueQuestionsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(MASTERY_REPOSITORY)
    private readonly mastery: IMasteryRepository,
  ) {}

  async execute(query: DueQuestionsQuery): Promise<readonly DueQuestion[]> {
    const session = await this.sessions.findById(query.sessionId);
    if (!session) {
      throw new SessionNotFoundError(query.sessionId);
    }

    const participant = await this.participants.findById(query.participantId);
    if (!participant || participant.sessionId !== query.sessionId) {
      throw new ParticipantNotFoundError(query.participantId);
    }

    const maitrises = await this.mastery.findByStudentKey(
      participant.studentKey,
    );
    const boites = boitesDues(
      maitrises.filter(
        (maitrise) => maitrise.studentKey === participant.studentKey,
      ),
      session.ouverteLe,
    );

    const dues: DueQuestion[] = [];
    for (const question of session.bareme.questions) {
      const boite = boites.get(question.concept);
      if (boite !== undefined) {
        dues.push({
          questionId: question.id,
          concept: question.concept,
          boite,
        });
      }
    }
    return dues.sort((premiere, seconde) => premiere.boite - seconde.boite);
  }
}

function boitesDues(
  maitrises: readonly MasteryRecord[],
  ouverteLe: Date,
): ReadonlyMap<string, Boite> {
  const boites = new Map<string, Boite>();
  for (const maitrise of maitrises) {
    const etat = {
      boite: maitrise.boite,
      seancesDepuisDerniereVue: seancesDepuis(maitrise, maitrises, ouverteLe),
    };
    if (isDue(etat)) {
      boites.set(maitrise.concept, maitrise.boite);
    }
  }
  return boites;
}

function seancesDepuis(
  maitrise: MasteryRecord,
  maitrises: readonly MasteryRecord[],
  ouverteLe: Date,
): number {
  const journees = new Set(
    maitrises
      .filter((autre) => posterieure(autre.derniereVue, maitrise.derniereVue))
      .map((autre) => journee(autre.derniereVue)),
  );
  if (posterieure(ouverteLe, maitrise.derniereVue)) {
    journees.add(journee(ouverteLe));
  }
  journees.delete(journee(maitrise.derniereVue));
  return journees.size;
}

function posterieure(date: Date, reference: Date): boolean {
  return date.getTime() > reference.getTime();
}

function journee(date: Date): string {
  return date.toISOString().slice(0, 10);
}
