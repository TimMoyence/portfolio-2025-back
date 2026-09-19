import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Optional,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { ITeacherAnnotationsRepository } from '../domain/ITeacherAnnotations.repository';
import type { IFormationGroupsRepository } from '../domain/IFormationGroups.repository';
import {
  FREE_RESPONSES_REPOSITORY,
  FORMATION_GROUPS_REPOSITORY,
  TEACHER_ANNOTATIONS_REPOSITORY,
} from '../domain/token';
import { OpenSessionUseCase } from '../application/OpenSession.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import type { DerouleCours } from '../domain/cours/DeroulePresentateur';
import { ControlSessionRequestDto } from './dto/control-session.request.dto';
import { DerouleResponseDto } from './dto/deroule.response.dto';
import { OpenSessionRequestDto } from './dto/open-session.request.dto';
import { OpenSessionResponseDto } from './dto/open-session.response.dto';
import { SessionResultsResponseDto } from './dto/session-results.response.dto';
import { SaveTeacherAnnotationRequestDto } from './dto/save-teacher-annotation.request.dto';
import { CreateFormationGroupRequestDto } from './dto/create-formation-group.request.dto';
import { RenameFormationGroupRequestDto } from './dto/rename-formation-group.request.dto';
import { AssignFormationGroupRequestDto } from './dto/assign-formation-group.request.dto';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_CONTROLE_PAR_MINUTE,
} from './formations-throttling';

/**
 * Pilotage d une session de cours par son formateur.
 *
 * Le garde de role atteste que l appelant est *un* formateur, jamais
 * *celui* de la session visee : le `sessionId` circule librement, il est
 * rendu a chaque etudiant qui rejoint et figure dans l URL du flux SSE.
 * Chaque route transmet donc l identifiant de l appelant au cas d usage,
 * qui verifie la propriete via SessionOwnership.ts.
 */
@ApiTags('formations')
@ApiBearerAuth()
@Controller('formations')
@UseGuards(RolesGuard)
@Roles('teacher')
export class FormationsPresenterController {
  constructor(
    private readonly openSession: OpenSessionUseCase,
    private readonly controlSession: ControlSessionUseCase,
    private readonly closeSession: CloseSessionUseCase,
    private readonly results: GetSessionResultsUseCase,
    private readonly streamSession: StreamSessionUseCase,
    private readonly lireDeroule: LireDerouleUseCase,
    @Optional()
    @Inject(TEACHER_ANNOTATIONS_REPOSITORY)
    private readonly annotations?: ITeacherAnnotationsRepository,
    @Optional()
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses?: IFreeResponsesRepository,
    @Optional()
    @Inject(FORMATION_GROUPS_REPOSITORY)
    private readonly groups?: IFormationGroupsRepository,
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
    });
    return { sessionId: result.sessionId, code: result.code };
  }

  @Post('sessions/:id/start')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Demarre la session et libere les reponses' })
  @ApiNoContentResponse({ description: 'Session demarree' })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
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
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
  async control(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ControlSessionRequestDto,
    @Req() request: Request,
  ): Promise<void> {
    if (dto.ecran === undefined && dto.mode === undefined) {
      throw new BadRequestException(
        'Indiquez un écran ou un mode de rythme à appliquer.',
      );
    }
    await this.controlSession.apply(id, request.user!.sub, {
      ecran: dto.ecran,
      mode: dto.mode,
      intervalle: dto.intervalle ?? null,
    });
  }

  @Post('sessions/:id/close')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cloture la session, envoie la synthese et les copies',
  })
  @ApiNoContentResponse({ description: 'Session cloturee' })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
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
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
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
  @ApiOperation({ summary: 'Rapport de session : notes, copies et incidents' })
  @ApiOkResponse({
    type: SessionResultsResponseDto,
    description: 'Rapport de la session et resultats agreges par question',
  })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
  async getResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ResultatsDeSeance> {
    return this.results.execute(id, request.user!.sub);
  }

  @Get('sessions/:id/report')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="bilan-seance.json"')
  @ApiOperation({ summary: 'Exporte le bilan JSON de la séance' })
  @ApiOkResponse({ type: SessionResultsResponseDto })
  async exportReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ResultatsDeSeance> {
    return this.results.execute(id, request.user!.sub);
  }

  @Get('sessions/:id/deroule')
  @ApiOperation({
    summary: 'Deroule annote de la seance, reserve au formateur proprietaire',
  })
  @ApiOkResponse({
    type: DerouleResponseDto,
    description:
      'Deroule annote du tirage de reference : notes, seuils et corriges',
  })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session ou cours introuvable' })
  async getDeroule(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<DerouleCours> {
    return this.lireDeroule.execute(id, request.user!.sub);
  }

  @Get('sessions/:id/annotations')
  @ApiOperation({
    summary: 'Liste les annotations du formateur pour une séance',
  })
  @ApiOkResponse({ description: 'Annotations synchronisées entre postes' })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  async getAnnotations(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    if (this.annotations === undefined) {
      throw new Error('Le dépôt des annotations n’est pas configuré');
    }
    return {
      annotations: await this.annotations.listBySession(id, request.user!.sub),
    };
  }

  @Post('sessions/:id/annotations')
  @ApiOperation({ summary: 'Enregistre une annotation formateur idempotente' })
  @ApiCreatedResponse({ description: 'Annotation enregistrée' })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  async saveAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveTeacherAnnotationRequestDto,
    @Req() request: Request,
  ) {
    if (this.annotations === undefined) {
      throw new Error('Le dépôt des annotations n’est pas configuré');
    }
    return this.annotations.save({
      sessionId: id,
      teacherId: request.user!.sub,
      screenId: dto.screenId,
      groupName: dto.groupName,
      note: dto.note,
    });
  }

  @Get('sessions/:id/free-responses')
  @ApiOperation({
    summary:
      'Liste les réponses libres de la séance pour le formateur propriétaire',
  })
  @ApiOkResponse({
    description: 'Réponses libres étudiantes, sans correction automatique',
  })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  async getFreeResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    if (this.freeResponses === undefined) {
      throw new Error('Le dépôt des réponses libres n’est pas configuré');
    }
    await this.results.execute(id, request.user!.sub);
    return { responses: await this.freeResponses.listBySession(id) };
  }

  @Get('sessions/:id/groups')
  @ApiOperation({ summary: 'Liste les groupes de la séance' })
  async getGroups(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    await this.results.execute(id, request.user!.sub);
    if (this.groups === undefined) {
      throw new Error('Le dépôt des groupes n’est pas configuré');
    }
    return { groups: await this.groups.listBySession(id) };
  }

  @Post('sessions/:id/groups')
  @ApiCreatedResponse({ description: 'Groupe créé' })
  async createGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFormationGroupRequestDto,
    @Req() request: Request,
  ) {
    await this.results.execute(id, request.user!.sub);
    if (this.groups === undefined) {
      throw new Error('Le dépôt des groupes n’est pas configuré');
    }
    return this.groups.create(id, dto.name.trim());
  }

  @Patch('sessions/:id/groups/:groupId')
  async renameGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: RenameFormationGroupRequestDto,
    @Req() request: Request,
  ) {
    await this.results.execute(id, request.user!.sub);
    if (this.groups === undefined) {
      throw new Error('Le dépôt des groupes n’est pas configuré');
    }
    return this.groups.rename(id, groupId, dto.name.trim());
  }

  @Patch('sessions/:id/participants/:participantId/group')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() dto: AssignFormationGroupRequestDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.results.execute(id, request.user!.sub);
    if (this.groups === undefined) {
      throw new Error('Le dépôt des groupes n’est pas configuré');
    }
    await this.groups.assignParticipant(id, participantId, dto.groupId);
  }

  @Delete('sessions/:id/participants/:participantId/group')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.results.execute(id, request.user!.sub);
    if (this.groups === undefined) {
      throw new Error('Le dépôt des groupes n’est pas configuré');
    }
    await this.groups.assignParticipant(id, participantId, null);
  }
}
