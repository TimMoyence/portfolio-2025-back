import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { EvincerParticipantUseCase } from '../application/EvincerParticipant.useCase';
import { ListSessionParticipantsUseCase } from '../application/ListSessionParticipants.useCase';
import type { ParticipantDeSeance } from '../application/ListSessionParticipants.useCase';
import { ReadmettreParticipantUseCase } from '../application/ReadmettreParticipant.useCase';
import { SessionParticipantsResponseDto } from './dto/session-participants.response.dto';
import {
  acteurDe,
  LectureDeSeance,
  PilotageDeSeance,
  ROLE_FORMATEUR,
} from './formations-acces';
import {
  FENETRE_THROTTLE_MS,
  LIMITE_EVICTION_PAR_MINUTE,
} from './formations-throttling';

@ApiTags('formations')
@ApiBearerAuth()
@Controller('formations')
@UseGuards(RolesGuard)
@Roles(ROLE_FORMATEUR)
export class FormationsParticipantsController {
  constructor(
    private readonly participants: ListSessionParticipantsUseCase,
    private readonly evincerParticipant: EvincerParticipantUseCase,
    private readonly readmettreParticipant: ReadmettreParticipantUseCase,
  ) {}

  @Get('sessions/:id/participants')
  @LectureDeSeance()
  @ApiOperation({ summary: 'Liste les participants de la séance' })
  @ApiOkResponse({ type: SessionParticipantsResponseDto })
  async getParticipants(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ participants: readonly ParticipantDeSeance[] }> {
    return {
      participants: await this.participants.execute(id, acteurDe(request)),
    };
  }

  @Throttle({
    default: {
      limit: LIMITE_EVICTION_PAR_MINUTE,
      ttl: FENETRE_THROTTLE_MS,
    },
  })
  @Delete('sessions/:id/participants/:participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PilotageDeSeance()
  @ApiOperation({
    summary:
      'Evince un participant : jeton revoque, place et graine liberees, reponses conservees',
  })
  @ApiNoContentResponse({ description: 'Participant evince' })
  @ApiNotFoundResponse({
    description: 'Seance ou participant introuvable dans la seance',
  })
  async evincer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.evincerParticipant.execute(id, request.user!.sub, participantId);
  }

  @Throttle({
    default: {
      limit: LIMITE_EVICTION_PAR_MINUTE,
      ttl: FENETRE_THROTTLE_MS,
    },
  })
  @Post('sessions/:id/participants/:participantId/readmission')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PilotageDeSeance()
  @ApiOperation({
    summary:
      'Readmet un participant evince : il reprend sa place, sa graine et ses reponses',
  })
  @ApiNoContentResponse({ description: 'Participant readmis' })
  @ApiNotFoundResponse({
    description:
      'Seance introuvable, ou participant absent de la seance ou jamais evince',
  })
  @ApiConflictResponse({
    description:
      'Seance revenue a sa capacite depuis l eviction : code SEANCE_COMPLETE',
  })
  async readmettre(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.readmettreParticipant.execute(
      id,
      request.user!.sub,
      participantId,
    );
  }
}
