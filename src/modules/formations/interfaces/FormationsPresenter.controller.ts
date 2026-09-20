import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { EMPTY, Observable } from 'rxjs';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { CloseSessionUseCase } from '../application/CloseSession.useCase';
import { ControlSessionUseCase } from '../application/ControlSession.useCase';
import { GetSessionResultsUseCase } from '../application/GetSessionResults.useCase';
import type { ResultatsDeSeance } from '../application/GetSessionResults.useCase';
import { LireDerouleUseCase } from '../application/LireDeroule.useCase';
import { ListFreeResponsesUseCase } from '../application/ListFreeResponses.useCase';
import { OpenSessionUseCase } from '../application/OpenSession.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import type { DerouleCours } from '../domain/cours/DeroulePresentateur';
import type { FreeResponseRecord } from '../domain/IFreeResponses.repository';
import { ControlSessionRequestDto } from './dto/contrat/control-session.request.dto';
import { DerouleResponseDto } from './dto/contrat/deroule.response.dto';
import { FreeResponsesResponseDto } from './dto/free-responses.response.dto';
import { OpenSessionRequestDto } from './dto/contrat/open-session.request.dto';
import { OpenSessionResponseDto } from './dto/open-session.response.dto';
import { SessionResultsResponseDto } from './dto/session-results.response.dto';
import {
  acteurDe,
  LectureDeSeance,
  PilotageDeSeance,
  ROLE_FORMATEUR,
} from './formations-acces';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_CONTROLE_PAR_MINUTE,
} from './formations-throttling';

/**
 * Pilotage d une seance de cours par son formateur.
 *
 * Le garde de role atteste que l appelant est *un* formateur, ou un
 * administrateur sur les lectures, jamais *celui* de la seance visee : le
 * `sessionId` circule librement, il est rendu a chaque etudiant qui rejoint
 * et figure dans l URL du flux SSE. Chaque route transmet donc l appelant au
 * cas d usage, qui applique la regle de SessionOwnership.ts : le proprietaire
 * seul pilote, le proprietaire ou un administrateur lit.
 */
@ApiTags('formations')
@ApiBearerAuth()
@Controller('formations')
@UseGuards(RolesGuard)
@Roles(ROLE_FORMATEUR)
export class FormationsPresenterController {
  constructor(
    private readonly openSession: OpenSessionUseCase,
    private readonly controlSession: ControlSessionUseCase,
    private readonly closeSession: CloseSessionUseCase,
    private readonly results: GetSessionResultsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly lireDeroule: LireDerouleUseCase,
    private readonly listFreeResponses: ListFreeResponsesUseCase,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Ouvre une session de cours et tire les sujets' })
  @ApiCreatedResponse({ type: OpenSessionResponseDto })
  @ApiNotFoundResponse({ description: 'Cours introuvable' })
  @ApiConflictResponse({
    description: 'Le cours ne produit pas assez de tirages non ambigus',
  })
  async open(
    @Body() dto: OpenSessionRequestDto,
    @Req() request: Request,
  ): Promise<OpenSessionResponseDto> {
    const result = await this.openSession.execute({
      courseSlug: dto.courseSlug,
      teacherId: request.user!.sub,
      capacite: dto.capacite,
    });
    return { sessionId: result.sessionId, code: result.code };
  }

  @Post('sessions/:id/start')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Demarre la session et libere les reponses' })
  @ApiNoContentResponse({ description: 'Session demarree' })
  @PilotageDeSeance()
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.controlSession.start(id, request.user!.sub);
  }

  @Patch('sessions/:id/control')
  @Throttle({
    default: {
      limit: LIMITE_CONTROLE_PAR_MINUTE,
      ttl: FENETRE_THROTTLE_MS,
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change l ecran courant ou le rythme de la session',
  })
  @ApiNoContentResponse({ description: 'Session pilotee' })
  @PilotageDeSeance()
  async control(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ControlSessionRequestDto,
    @Req() request: Request,
  ): Promise<void> {
    if (
      dto.ecran === undefined &&
      dto.mode === undefined &&
      dto.pilotage === undefined
    ) {
      throw new BadRequestException(
        'Indiquez un écran, un mode de rythme ou un pilotage d’écran à appliquer.',
      );
    }
    await this.controlSession.apply(id, request.user!.sub, {
      ecran: dto.ecran,
      mode: dto.mode,
      intervalle: dto.intervalle ?? null,
      pilotage: dto.pilotage,
    });
  }

  @Post('sessions/:id/close')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Cloture la session, enregistre les scores, envoie la synthese et les copies',
  })
  @ApiNoContentResponse({ description: 'Session cloturee' })
  @ApiConflictResponse({ description: 'Seance deja terminee' })
  @PilotageDeSeance()
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.closeSession.execute(id, request.user!.sub);
  }

  @Sse('sessions/:id/presenter-stream')
  @ApiOperation({
    summary: 'Flux temps reel reserve au formateur de la session',
  })
  @PilotageDeSeance()
  @ApiTooManyRequestsResponse({
    description:
      'Trop d ouvertures par minute (throttler global) ; au-dela de quatre flux, le plus ancien du formateur est ferme',
  })
  async presenterStream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<Observable<MessageEvent>> {
    let clientDeconnecte = false;
    request.once('close', () => {
      clientDeconnecte = true;
    });
    const flux = await this.streamSession.executeForTeacher(
      id,
      request.user!.sub,
    );
    return clientDeconnecte || request.destroyed ? EMPTY : flux;
  }

  @Get('sessions/:id/results')
  @LectureDeSeance()
  @ApiOperation({
    summary: 'Rapport de session : notes, copies, statistiques et barème',
  })
  @ApiOkResponse({
    type: SessionResultsResponseDto,
    description: 'Rapport de la session et resultats agreges par question',
  })
  async getResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ResultatsDeSeance> {
    return this.results.execute(id, acteurDe(request));
  }

  @Get('sessions/:id/report')
  @LectureDeSeance()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="bilan-seance.json"')
  @ApiOperation({ summary: 'Exporte le bilan JSON de la séance' })
  @ApiOkResponse({ type: SessionResultsResponseDto })
  async exportReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ResultatsDeSeance> {
    return this.results.execute(id, acteurDe(request));
  }

  @Get('sessions/:id/deroule')
  @LectureDeSeance()
  @ApiOperation({
    summary: 'Deroule annote de la seance, reserve au formateur proprietaire',
  })
  @ApiOkResponse({
    type: DerouleResponseDto,
    description:
      'Deroule annote du tirage de reference : notes, seuils et corriges',
  })
  async getDeroule(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<DerouleCours> {
    return this.lireDeroule.execute(id, acteurDe(request));
  }

  @Get('sessions/:id/free-responses')
  @LectureDeSeance()
  @ApiOperation({
    summary:
      'Liste les réponses libres de la séance pour le formateur propriétaire',
  })
  @ApiOkResponse({
    type: FreeResponsesResponseDto,
    description: 'Réponses libres étudiantes, sans correction automatique',
  })
  async getFreeResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ responses: readonly FreeResponseRecord[] }> {
    return {
      responses: await this.listFreeResponses.execute(id, acteurDe(request)),
    };
  }
}
