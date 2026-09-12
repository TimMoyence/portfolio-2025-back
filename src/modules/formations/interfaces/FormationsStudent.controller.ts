import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Optional,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { PublicFormProtectionService } from '../../../common/interfaces/security/public-form-protection.service';
import { JoinSessionUseCase } from '../application/JoinSession.useCase';
import { RecordIncidentsUseCase } from '../application/RecordIncidents.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../application/SubmitAnswer.useCase';
import { JoinSessionRequestDto } from './dto/join-session.request.dto';
import { JoinSessionResponseDto } from './dto/join-session.response.dto';
import { ReportIncidentsRequestDto } from './dto/report-incidents.request.dto';
import { SubmitAnswerRequestDto } from './dto/submit-answer.request.dto';
import { SubmitAnswerResponseDto } from './dto/submit-answer.response.dto';
import { ParticipantTokenService } from './ParticipantToken.service';

const EN_TETE_JETON = 'x-participant-token';

/**
 * Poste etudiant : aucune de ces reponses ne porte le corrige.
 *
 * L inscription rend le `seed` et rien d autre du bareme ; c est le
 * fichier de cours cote client qui reconstruit les enonces a partir de ce
 * tirage. La correction reste au serveur (SubmitAnswer.useCase.ts) et ne
 * redescend que sous forme de verdict et d etiquette de confusion.
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
    private readonly tokens: ParticipantTokenService,
    @Optional()
    private readonly formProtection = new PublicFormProtectionService(),
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('sessions/:code/join')
  @ApiOperation({ summary: 'Rejoint une session avec le code dicte en classe' })
  @ApiCreatedResponse({ type: JoinSessionResponseDto })
  @ApiBadRequestResponse({ description: 'Code de session invalide' })
  async join(
    @Param('code') code: string,
    @Body() dto: JoinSessionRequestDto,
  ): Promise<JoinSessionResponseDto> {
    this.formProtection.assertHuman({
      honeypot: dto.website,
      formStartedAt: dto.formStartedAt,
    });
    const result = await this.joinSession.execute({
      code,
      studentKey: dto.studentKey,
      prenom: dto.prenom,
      nom: dto.nom,
      email: dto.email,
    });
    return {
      participantId: result.participantId,
      sessionId: result.sessionId,
      seed: result.seed,
      ecranCourant: result.ecranCourant,
      modeRythme: result.modeRythme,
      jeton: this.tokens.sign(result.sessionId, result.participantId),
    };
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
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
    return { correcte: verdict.correcte, misconception: verdict.misconception };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
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

  @SkipThrottle()
  @Sse('sessions/:id/stream')
  @ApiOperation({ summary: 'Flux temps reel de l etat de la session' })
  stream(@Param('id', ParseUUIDPipe) id: string): Observable<MessageEvent> {
    return this.streamSession.execute(id);
  }
}
