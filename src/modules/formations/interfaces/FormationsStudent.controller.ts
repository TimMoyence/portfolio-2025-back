import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Optional,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { resolveClientIpOrUnknown } from '../../../common/interfaces/security/client-ip.util';
import { PublicFormProtectionService } from '../../../common/interfaces/security/public-form-protection.service';
import type { DueQuestion } from '../application/DueQuestions.useCase';
import { DueQuestionsUseCase } from '../application/DueQuestions.useCase';
import { JoinSessionUseCase } from '../application/JoinSession.useCase';
import { LireSujetUseCase } from '../application/LireSujet.useCase';
import { RecordIncidentsUseCase } from '../application/RecordIncidents.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../application/SubmitAnswer.useCase';
import type { CoursPublic } from '../domain/cours/CoursPublic';
import {
  InvalidSessionCodeError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import { CodeScanProtectionService } from './CodeScanProtection.service';
import { ParticipantTokenGuard } from './ParticipantToken.guard';
import { JoinSessionRequestDto } from './dto/join-session.request.dto';
import { JoinSessionResponseDto } from './dto/join-session.response.dto';
import { ReportIncidentsRequestDto } from './dto/report-incidents.request.dto';
import { SubmitAnswerRequestDto } from './dto/submit-answer.request.dto';
import { SubmitAnswerResponseDto } from './dto/submit-answer.response.dto';
import { SujetResponseDto } from './dto/sujet.response.dto';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_FLUX_PAR_PARTICIPANT,
  LIMITE_INCIDENTS_PAR_PARTICIPANT,
  LIMITE_JOIN_PAR_CODE,
  LIMITE_REPONSES_PAR_PARTICIPANT,
  LIMITE_REVISION_PAR_PARTICIPANT,
  LIMITE_SUJET_PAR_PARTICIPANT,
  suivreParCodeDeSession,
  suivreParParticipant,
} from './formations-throttling';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from './ParticipantToken.service';

/**
 * Poste etudiant : aucune de ces reponses ne porte le corrige.
 *
 * L inscription ne rend ni le bareme ni la graine du tirage attribue : le
 * moteur de tirage et le cours sont publics (domain/cours), la graine
 * suffirait a recalculer le corrige de l etudiant. Le sujet est calcule par
 * le serveur et servi par `GET sessions/:id/sujet`. La correction reste au
 * serveur (SubmitAnswer.useCase.ts) et ne redescend que sous forme de
 * verdict et d etiquette de confusion.
 */
@ApiTags('formations')
@Public()
@Controller('formations')
export class FormationsStudentController {
  constructor(
    private readonly joinSession: JoinSessionUseCase,
    private readonly submitAnswer: SubmitAnswerUseCase,
    private readonly recordIncidents: RecordIncidentsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly dueQuestions: DueQuestionsUseCase,
    private readonly lireSujet: LireSujetUseCase,
    private readonly tokens: ParticipantTokenService,
    private readonly codeScan: CodeScanProtectionService,
    @Optional()
    private readonly formProtection = new PublicFormProtectionService(),
  ) {}

  @Throttle({
    default: {
      limit: LIMITE_JOIN_PAR_CODE,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParCodeDeSession,
    },
  })
  @Post('sessions/:code/join')
  @ApiOperation({ summary: 'Rejoint une session avec le code dicte en classe' })
  @ApiCreatedResponse({ type: JoinSessionResponseDto })
  @ApiBadRequestResponse({ description: 'Code de session invalide' })
  @ApiTooManyRequestsResponse({ description: 'Balayage de codes detecte' })
  async join(
    @Param('code') code: string,
    @Body() dto: JoinSessionRequestDto,
    @Req() request: Request,
  ): Promise<JoinSessionResponseDto> {
    const adresse = resolveClientIpOrUnknown(request);
    this.codeScan.assertPasDeBalayage(adresse);
    this.formProtection.assertHuman({
      honeypot: dto.website,
      formStartedAt: dto.formStartedAt,
    });
    const result = await this.joinSession
      .execute({
        code,
        studentKey: dto.studentKey,
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
      })
      .catch((error: unknown) => {
        if (estCodeSansSeance(error)) {
          this.codeScan.enregistrerEchec(adresse);
        }
        throw error;
      });
    return {
      participantId: result.participantId,
      sessionId: result.sessionId,
      ecranCourant: result.ecranCourant,
      modeRythme: result.modeRythme,
      jeton: this.tokens.sign(result.sessionId, result.participantId),
    };
  }

  @Throttle({
    default: {
      limit: LIMITE_REPONSES_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Post('sessions/:id/answers')
  @ApiOperation({ summary: 'Soumet une reponse, corrigee cote serveur' })
  @ApiCreatedResponse({ type: SubmitAnswerResponseDto })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async answer(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SubmitAnswerRequestDto,
  ): Promise<SubmitAnswerResponseDto> {
    const participantId = this.tokens.verify(sessionId, jeton);
    const verdict = await this.submitAnswer.execute({
      sessionId,
      participantId,
      questionId: dto.questionId,
      valeur: dto.valeur,
      dureeMs: dto.dureeMs,
    });
    return {
      correcte: verdict.correcte,
      misconception: verdict.misconception,
      libelleConfusion: verdict.libelleConfusion,
    };
  }

  @Throttle({
    default: {
      limit: LIMITE_INCIDENTS_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Post('sessions/:id/incidents')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remonte le journal d incidents du poste etudiant' })
  @ApiNoContentResponse({ description: 'Incidents enregistres' })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async incidents(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: ReportIncidentsRequestDto,
  ): Promise<void> {
    const participantId = this.tokens.verify(sessionId, jeton);
    await this.recordIncidents.execute(
      dto.incidents.map((incident) => ({
        sessionId,
        participantId,
        type: incident.type,
        contexte: incident.contexte ?? null,
        horodatage: incident.horodatage,
      })),
    );
  }

  @Throttle({
    default: {
      limit: LIMITE_REVISION_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Get('sessions/:id/due-questions')
  @ApiOperation({
    summary: 'Liste les questions a revoir, de la premiere boite a la derniere',
  })
  @ApiOkResponse({
    description: 'Questions dues, sans aucune valeur de bareme',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async questionsDues(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
  ): Promise<{ questions: readonly DueQuestion[] }> {
    const participantId = this.tokens.verify(sessionId, jeton);
    return {
      questions: await this.dueQuestions.execute({ sessionId, participantId }),
    };
  }

  @Throttle({
    default: {
      limit: LIMITE_SUJET_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @UseGuards(ParticipantTokenGuard)
  @Get('sessions/:id/sujet')
  @ApiOperation({
    summary: 'Sert au participant le sujet de son propre tirage',
  })
  @ApiOkResponse({
    type: SujetResponseDto,
    description: 'Sujet du tirage du participant, sans corrige',
  })
  @ApiConflictResponse({
    description: 'Le cours a change depuis l ouverture de la seance',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async sujet(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Req() request: Request,
  ): Promise<CoursPublic> {
    return this.lireSujet.execute({
      sessionId,
      participantId: request.participantId!,
    });
  }

  @Throttle({
    default: {
      limit: LIMITE_FLUX_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @UseGuards(ParticipantTokenGuard)
  @Sse('sessions/:id/stream')
  @ApiOperation({ summary: 'Flux temps reel de l etat de la session' })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  @ApiTooManyRequestsResponse({
    description:
      'Trop de flux ouverts sur la session ou par ce participant (deux au plus)',
  })
  stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Observable<MessageEvent> {
    return this.streamSession.execute(id, request.participantId!);
  }
}

function estCodeSansSeance(error: unknown): boolean {
  return (
    error instanceof SessionNotFoundError ||
    error instanceof InvalidSessionCodeError
  );
}
