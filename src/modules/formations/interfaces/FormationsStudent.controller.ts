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
  Put,
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
import { DeclarerJalonUseCase } from '../application/DeclarerJalon.useCase';
import { DefisUseCase } from '../application/Defis.useCase';
import { LireEtatParticipantUseCase } from '../application/LireEtatParticipant.useCase';
import { LireRappelsUseCase } from '../application/LireRappels.useCase';
import type { CoursPublic } from '../domain/contrats/tirage';
import {
  InvalidSessionCodeError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import { CleEtudiantService } from './CleEtudiant.service';
import { CodeScanProtectionService } from './CodeScanProtection.service';
import { ParticipantTokenGuard } from './ParticipantToken.guard';
import { JoinSessionRequestDto } from './dto/join-session.request.dto';
import { JoinSessionResponseDto } from './dto/join-session.response.dto';
import { FreeResponseSavedResponseDto } from './dto/free-responses.response.dto';
import { ReportIncidentsRequestDto } from './dto/report-incidents.request.dto';
import { SaveFreeResponseRequestDto } from './dto/save-free-response.request.dto';
import { SubmitAnswerRequestDto } from './dto/submit-answer.request.dto';
import { SubmitAnswerResponseDto } from './dto/submit-answer.response.dto';
import { DeclarerJalonRequestDto } from './dto/contrat/declarer-jalon.request.dto';
import { EtatParticipantResponseDto } from './dto/contrat/etat-participant.response.dto';
import { RappelsResponseDto } from './dto/contrat/rappels.response.dto';
import { StrategiesDefiResponseDto } from './dto/contrat/strategies-defi.response.dto';
import { SubmitDefiRequestDto } from './dto/contrat/submit-defi.request.dto';
import { SubmitProductionRequestDto } from './dto/contrat/submit-production.request.dto';
import { TentativeEnigmeResponseDto } from './dto/contrat/tentative-enigme.response.dto';
import { TenterEnigmeRequestDto } from './dto/contrat/tenter-enigme.request.dto';
import { SubmitProductionResponseDto } from './dto/contrat/verdict-production.response.dto';
import { SujetResponseDto } from './dto/contrat/sujet.response.dto';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_FLUX_PAR_PARTICIPANT,
  LIMITE_ETAT_PAR_PARTICIPANT,
  LIMITE_INCIDENTS_PAR_PARTICIPANT,
  LIMITE_JALONS_PAR_PARTICIPANT,
  LIMITE_JOIN_PAR_CODE,
  LIMITE_RAPPELS_PAR_PARTICIPANT,
  LIMITE_REPONSES_PAR_PARTICIPANT,
  LIMITE_REVISION_PAR_PARTICIPANT,
  LIMITE_SUJET_PAR_PARTICIPANT,
  LIMITE_TENTATIVES_PAR_PARTICIPANT,
  LimiteParParticipant,
  suivreParCodeDeSession,
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
    private readonly declarerJalon: DeclarerJalonUseCase,
    private readonly defis: DefisUseCase,
    private readonly lireEtatParticipant: LireEtatParticipantUseCase,
    private readonly lireRappels: LireRappelsUseCase,
    private readonly recordIncidents: RecordIncidentsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly dueQuestions: DueQuestionsUseCase,
    private readonly lireSujet: LireSujetUseCase,
    private readonly saveFreeResponse: SaveFreeResponseUseCase,
    private readonly tokens: ParticipantTokenService,
    private readonly clesEtudiants: CleEtudiantService,
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
        studentKey: this.clesEtudiants.de(dto.email),
        prenom: dto.prenom,
        nom: dto.nom,
        email: dto.email,
        secretDeReprise: dto.secretDeReprise,
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
      jeton: this.tokens.sign(
        result.sessionId,
        result.participantId,
        result.generationDeJeton,
      ),
      secretDeReprise: result.secretDeReprise,
    };
  }

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
  @Post('sessions/:id/answers')
  @ApiOperation({ summary: 'Soumet une reponse, corrigee cote serveur' })
  @ApiCreatedResponse({ type: SubmitAnswerResponseDto })
  @ApiConflictResponse({
    description:
      'Reponse refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE, PHASE_FERMEE, REPONSE_DEJA_ENREGISTREE ou COURS_MODIFIE',
  })
  @ApiNotFoundResponse({
    description:
      'Ecran non encore projete par le formateur : code ECRAN_NON_SERVI',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async answer(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SubmitAnswerRequestDto,
  ): Promise<SubmitAnswerResponseDto> {
    const participantId = await this.tokens.verify(sessionId, jeton);
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

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
  @Post('sessions/:id/free-responses')
  @ApiOperation({
    summary:
      'Enregistre la reponse libre du participant, la derniere envoyee remplace la precedente',
  })
  @ApiCreatedResponse({ type: FreeResponseSavedResponseDto })
  @ApiBadRequestResponse({
    description:
      'Reponse vide une fois les blancs retires, ou activite inconnue de l ecran : code ACTIVITE_INCONNUE',
  })
  @ApiNotFoundResponse({
    description:
      'Seance ou cours introuvable, ou ecran non encore projete : code ECRAN_NON_SERVI',
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
    const participantId = await this.tokens.verify(sessionId, jeton);
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

  @LimiteParParticipant(LIMITE_REPONSES_PAR_PARTICIPANT)
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
      'Production refusee, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE, ECRAN_NON_SERVI, REPONSE_DEJA_ENREGISTREE ou REPRISES_EPUISEES',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async production(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SubmitProductionRequestDto,
  ): Promise<SubmitProductionResponseDto> {
    const participantId = await this.tokens.verify(sessionId, jeton);
    return this.submitProduction.execute({
      sessionId,
      participantId,
      questionId: dto.questionId,
      valeur: dto.valeur,
      dureeMs: dto.dureeMs,
    });
  }

  @LimiteParParticipant(LIMITE_TENTATIVES_PAR_PARTICIPANT)
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
    const participantId = await this.tokens.verify(sessionId, jeton);
    return this.tenterEnigme.execute({
      sessionId,
      participantId,
      parcoursId,
      enigmeId: dto.enigmeId,
      reponse: dto.reponse,
      dureeMs: dto.dureeMs,
    });
  }

  @LimiteParParticipant(LIMITE_JALONS_PAR_PARTICIPANT)
  @Put('sessions/:id/pulses/:sondageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Declare l etat du jalon de confiance, anonymise par HMAC',
  })
  @ApiNoContentResponse({ description: 'Jalon enregistre' })
  @ApiBadRequestResponse({ description: 'Sondage inconnu du cours' })
  @ApiConflictResponse({
    description:
      'Jalon refuse, cause dans le champ code du corps : SEANCE_NON_DEMARREE, SEANCE_TERMINEE ou ECRAN_NON_SERVI',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async jalon(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('sondageId') sondageId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: DeclarerJalonRequestDto,
  ): Promise<void> {
    const participantId = await this.tokens.verify(sessionId, jeton);
    await this.declarerJalon.execute({
      sessionId,
      participantId,
      sondageId,
      etat: dto.etat,
    });
  }

  @LimiteParParticipant(LIMITE_TENTATIVES_PAR_PARTICIPANT)
  @Post('sessions/:id/defis/:defiId/tentative')
  @ApiOperation({
    summary:
      'Envoie la tentative du defi et rend les strategies de reference, sans leur justesse',
  })
  @ApiCreatedResponse({ type: StrategiesDefiResponseDto })
  @ApiNotFoundResponse({ description: 'Defi absent du cours' })
  @ApiBadRequestResponse({ description: 'Tentative vide' })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async tentativeDeDefi(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('defiId') defiId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: SubmitDefiRequestDto,
  ): Promise<StrategiesDefiResponseDto> {
    const participantId = await this.tokens.verify(sessionId, jeton);
    return this.defis.tenter({
      sessionId,
      participantId,
      defiId,
      texte: dto.texte,
      dureeMs: dto.dureeMs,
    });
  }

  @LimiteParParticipant(LIMITE_JALONS_PAR_PARTICIPANT)
  @Get('sessions/:id/defis/:defiId/strategies')
  @ApiOperation({
    summary:
      'Resert les strategies du defi, avec leur justesse seulement apres la revelation',
  })
  @ApiOkResponse({ type: StrategiesDefiResponseDto })
  @ApiNotFoundResponse({
    description: 'Defi inconnu, ou aucune tentative envoyee',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async strategiesDuDefi(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Param('defiId') defiId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
  ): Promise<StrategiesDefiResponseDto> {
    const participantId = await this.tokens.verify(sessionId, jeton);
    return this.defis.strategies(sessionId, participantId, defiId);
  }

  @LimiteParParticipant(LIMITE_ETAT_PAR_PARTICIPANT)
  @UseGuards(ParticipantTokenGuard)
  @Get('sessions/:id/moi')
  @ApiOperation({
    summary:
      'Rend l etat du seul participant porte par le jeton, pour reprendre apres un rechargement',
  })
  @ApiOkResponse({ type: EtatParticipantResponseDto })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async monEtat(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Req() request: Request,
  ): Promise<EtatParticipantResponseDto> {
    return this.lireEtatParticipant.execute({
      sessionId,
      participantId: request.participantId!,
    }) as Promise<EtatParticipantResponseDto>;
  }

  @LimiteParParticipant(LIMITE_RAPPELS_PAR_PARTICIPANT)
  @UseGuards(ParticipantTokenGuard)
  @Get('sessions/:id/rappels')
  @ApiOperation({
    summary:
      'Sert la liste figee des rappels espaces du participant, options melangees par sa graine',
  })
  @ApiOkResponse({ type: RappelsResponseDto })
  @ApiNotFoundResponse({ description: 'Cours sans ecran de rappel espace' })
  @ApiConflictResponse({
    description:
      'Rappels refuses, cause dans le champ code du corps : ECRAN_NON_SERVI',
  })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  async rappels(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Req() request: Request,
  ): Promise<RappelsResponseDto> {
    return this.lireRappels.execute({
      sessionId,
      participantId: request.participantId!,
    }) as Promise<RappelsResponseDto>;
  }

  @LimiteParParticipant(LIMITE_INCIDENTS_PAR_PARTICIPANT)
  @Post('sessions/:id/incidents')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remonte le journal d incidents du poste etudiant' })
  @ApiNoContentResponse({ description: 'Incidents enregistres' })
  @ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' })
  @ApiConflictResponse({
    description: 'SEANCE_TERMINEE : la seance est close',
  })
  async incidents(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Headers(EN_TETE_JETON) jeton: string | undefined,
    @Body() dto: ReportIncidentsRequestDto,
  ): Promise<void> {
    const participantId = await this.tokens.verify(sessionId, jeton);
    await this.recordIncidents.execute(
      sessionId,
      participantId,
      dto.incidents.map((incident) => ({
        sessionId,
        participantId,
        type: incident.type,
        contexte: incident.contexte ?? null,
        horodatage: incident.horodatage,
      })),
    );
  }

  @LimiteParParticipant(LIMITE_REVISION_PAR_PARTICIPANT)
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
    const participantId = await this.tokens.verify(sessionId, jeton);
    return {
      questions: await this.dueQuestions.execute({ sessionId, participantId }),
    };
  }

  @LimiteParParticipant(LIMITE_SUJET_PAR_PARTICIPANT)
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

  @LimiteParParticipant(LIMITE_FLUX_PAR_PARTICIPANT)
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
    return this.streamSession.execute(
      id,
      request.participantId!,
      request.generationDeJeton!,
    );
  }
}

function estCodeSansSeance(error: unknown): boolean {
  return (
    error instanceof SessionNotFoundError ||
    error instanceof InvalidSessionCodeError
  );
}
