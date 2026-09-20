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
  ApiNotFoundResponse,
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
import { SaveFreeResponseUseCase } from '../application/SaveFreeResponse.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../application/SubmitAnswer.useCase';
import { SubmitProductionUseCase } from '../application/SubmitProduction.useCase';
import { TenterEnigmeUseCase } from '../application/TenterEnigme.useCase';
import type { CoursPublic } from '../domain/contrats/tirage';
import {
  InvalidSessionCodeError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import { CodeScanProtectionService } from './CodeScanProtection.service';
import { ParticipantTokenGuard } from './ParticipantToken.guard';
import { JoinSessionRequestDto } from './dto/join-session.request.dto';
import { JoinSessionResponseDto } from './dto/join-session.response.dto';
import { FreeResponseSavedResponseDto } from './dto/free-responses.response.dto';
import { ReportIncidentsRequestDto } from './dto/report-incidents.request.dto';
import { SaveFreeResponseRequestDto } from './dto/save-free-response.request.dto';
import { SubmitAnswerRequestDto } from './dto/submit-answer.request.dto';
import { SubmitAnswerResponseDto } from './dto/submit-answer.response.dto';
import { SubmitProductionRequestDto } from './dto/contrat/submit-production.request.dto';
import { TentativeEnigmeResponseDto } from './dto/contrat/tentative-enigme.response.dto';
import { TenterEnigmeRequestDto } from './dto/contrat/tenter-enigme.request.dto';
import { SubmitProductionResponseDto } from './dto/contrat/verdict-production.response.dto';
import { SujetResponseDto } from './dto/contrat/sujet.response.dto';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_FLUX_PAR_PARTICIPANT,
  LIMITE_INCIDENTS_PAR_PARTICIPANT,
  LIMITE_JOIN_PAR_CODE,
  LIMITE_REPONSES_PAR_PARTICIPANT,
  LIMITE_REVISION_PAR_PARTICIPANT,
  LIMITE_SUJET_PAR_PARTICIPANT,
  LIMITE_TENTATIVES_PAR_PARTICIPANT,
  suivreParCodeDeSession,
  suivreParParticipant,
} from './formations-throttling';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from './ParticipantToken.service';

@ApiTags('formations')
@Public()
@Controller('formations')
export class FormationsStudentController {
  constructor(
    private readonly joinSession: JoinSessionUseCase,
    private readonly submitAnswer: SubmitAnswerUseCase,
    private readonly submitProduction: SubmitProductionUseCase,
    private readonly tenterEnigme: TenterEnigmeUseCase,
    private readonly recordIncidents: RecordIncidentsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly dueQuestions: DueQuestionsUseCase,
    private readonly lireSujet: LireSujetUseCase,
    private readonly saveFreeResponse: SaveFreeResponseUseCase,
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
  @ApiConflictResponse({
    description:
      'Reponse refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE ou REPONSE_DEJA_ENREGISTREE',
  })
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
      limit: LIMITE_REPONSES_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Post('sessions/:id/free-responses')
  @ApiOperation({
    summary:
      'Enregistre la reponse libre du participant, la derniere envoyee remplace la precedente',
  })
  @ApiCreatedResponse({ type: FreeResponseSavedResponseDto })
  @ApiBadRequestResponse({
    description: 'Reponse vide une fois les blancs retires',
  })
  @ApiConflictResponse({
    description:
      'Reponse refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE ou SEANCE_TERMINEE',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async freeResponse(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SaveFreeResponseRequestDto,
  ): Promise<FreeResponseSavedResponseDto> {
    const participantId = this.tokens.verify(sessionId, jeton);
    await this.saveFreeResponse.execute({
      sessionId,
      participantId,
      screenId: dto.screenId,
      activityId: dto.activityId,
      response: dto.response,
      dureeMs: dto.dureeMs,
    });
    return { status: 'enregistre' };
  }

  @Throttle({
    default: {
      limit: LIMITE_REPONSES_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Post('sessions/:id/productions')
  @ApiOperation({
    summary: 'Soumet une production, corrigee et notee cote serveur',
  })
  @ApiCreatedResponse({ type: SubmitProductionResponseDto })
  @ApiBadRequestResponse({
    description:
      'Production refusee, cause dans le champ code du corps : TYPE_DE_QUESTION, PRODUCTION_VIDE ou PRODUCTION_INVALIDE',
  })
  @ApiConflictResponse({
    description:
      'Production refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE, ECRAN_NON_SERVI ou REPONSE_DEJA_ENREGISTREE',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async production(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SubmitProductionRequestDto,
  ): Promise<SubmitProductionResponseDto> {
    const participantId = this.tokens.verify(sessionId, jeton);
    return this.submitProduction.execute({
      sessionId,
      participantId,
      questionId: dto.questionId,
      valeur: dto.valeur,
      dureeMs: dto.dureeMs,
    });
  }

  @Throttle({
    default: {
      limit: LIMITE_TENTATIVES_PAR_PARTICIPANT,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  })
  @Post('sessions/:id/escape/:parcoursId/tentatives')
  @ApiOperation({
    summary: 'Tente une enigme, corrigee et plafonnee cote serveur',
  })
  @ApiCreatedResponse({ type: TentativeEnigmeResponseDto })
  @ApiNotFoundResponse({ description: 'Enigme absente du parcours' })
  @ApiConflictResponse({
    description:
      'Tentative refusee, cause dans le champ code du corps : ECRAN_NON_SERVI, ENIGME_VERROUILLEE, ENIGME_DEJA_RESOLUE ou TENTATIVES_EPUISEES',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async tentativeEnigme(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('parcoursId') parcoursId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: TenterEnigmeRequestDto,
  ): Promise<TentativeEnigmeResponseDto> {
    const participantId = this.tokens.verify(sessionId, jeton);
    return this.tenterEnigme.execute({
      sessionId,
      participantId,
      parcoursId,
      enigmeId: dto.enigmeId,
      reponse: dto.reponse,
      dureeMs: dto.dureeMs,
    });
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
      'Seance pleine (cent flux etudiants) ou trop d ouvertures par minute ; au-dela de deux flux, le plus ancien du participant est ferme',
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
