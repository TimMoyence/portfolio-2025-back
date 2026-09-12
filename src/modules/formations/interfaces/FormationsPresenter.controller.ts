import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { CloseSessionUseCase } from '../application/CloseSession.useCase';
import { ControlSessionUseCase } from '../application/ControlSession.useCase';
import { GetSessionResultsUseCase } from '../application/GetSessionResults.useCase';
import { OpenSessionUseCase } from '../application/OpenSession.useCase';
import { StreamSessionUseCase } from '../application/StreamSession.useCase';
import type { RapportSession } from '../domain/IFormationMailer.port';
import { ControlSessionRequestDto } from './dto/control-session.request.dto';
import { OpenSessionRequestDto } from './dto/open-session.request.dto';
import { OpenSessionResponseDto } from './dto/open-session.response.dto';

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
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Ouvre une session de cours et depose le bareme' })
  @ApiOkResponse({ type: OpenSessionResponseDto })
  async open(
    @Body() dto: OpenSessionRequestDto,
    @Req() request: Request,
  ): Promise<OpenSessionResponseDto> {
    const result = await this.openSession.execute({
      courseSlug: dto.courseSlug,
      teacherId: request.user!.sub,
      bareme: dto.bareme,
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
  async presenterStream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<Observable<MessageEvent>> {
    return this.streamSession.executeForTeacher(id, request.user!.sub);
  }

  @Get('sessions/:id/results')
  @ApiOperation({ summary: 'Rapport de session : notes, copies et incidents' })
  @ApiOkResponse({ description: 'Rapport de la session' })
  @ApiForbiddenResponse({ description: 'Session d un autre formateur' })
  @ApiNotFoundResponse({ description: 'Session introuvable' })
  async getResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<RapportSession> {
    return this.results.execute(id, request.user!.sub);
  }
}
