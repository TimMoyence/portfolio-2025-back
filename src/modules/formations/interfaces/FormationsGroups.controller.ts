import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { ManageFormationGroupsUseCase } from '../application/ManageFormationGroups.useCase';
import { ReadmettreParticipantUseCase } from '../application/ReadmettreParticipant.useCase';
import type { FormationGroupRecord } from '../domain/IFormationGroups.repository';
import { AssignFormationGroupRequestDto } from './dto/assign-formation-group.request.dto';
import { FormationGroupNameRequestDto } from './dto/formation-group-name.request.dto';
import {
  FormationGroupResponseDto,
  FormationGroupsResponseDto,
  SessionParticipantsResponseDto,
} from './dto/formation-groups.response.dto';
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

const NOM_DEJA_PRIS =
  'Nom déjà pris dans la séance, cause dans le champ code : NOM_DE_GROUPE_DEJA_PRIS';
const NOM_VIDE = 'Nom de groupe vide une fois les blancs retirés';

@ApiTags('formations')
@ApiBearerAuth()
@Controller('formations')
@UseGuards(RolesGuard)
@Roles(ROLE_FORMATEUR)
export class FormationsGroupsController {
  constructor(
    private readonly groups: ManageFormationGroupsUseCase,
    private readonly participants: ListSessionParticipantsUseCase,
    private readonly evincerParticipant: EvincerParticipantUseCase,
    private readonly readmettreParticipant: ReadmettreParticipantUseCase,
  ) {}

  @Get('sessions/:id/participants')
  @LectureDeSeance()
  @ApiOperation({
    summary: 'Liste les participants de la séance avec leur groupe',
  })
  @ApiOkResponse({ type: SessionParticipantsResponseDto })
  async getParticipants(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ participants: readonly ParticipantDeSeance[] }> {
    return {
      participants: await this.participants.execute(id, acteurDe(request)),
    };
  }

  @Get('sessions/:id/groups')
  @LectureDeSeance()
  @ApiOperation({ summary: 'Liste les groupes de la séance' })
  @ApiOkResponse({ type: FormationGroupsResponseDto })
  async getGroups(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ groups: readonly FormationGroupRecord[] }> {
    return { groups: await this.groups.list(id, acteurDe(request)) };
  }

  @Post('sessions/:id/groups')
  @PilotageDeSeance()
  @ApiOperation({ summary: 'Crée un groupe dans la séance' })
  @ApiCreatedResponse({ type: FormationGroupResponseDto })
  @ApiBadRequestResponse({ description: NOM_VIDE })
  @ApiConflictResponse({ description: NOM_DEJA_PRIS })
  async createGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FormationGroupNameRequestDto,
    @Req() request: Request,
  ): Promise<FormationGroupRecord> {
    return this.groups.create(id, request.user!.sub, dto.name);
  }

  @Patch('sessions/:id/groups/:groupId')
  @PilotageDeSeance()
  @ApiOperation({ summary: 'Renomme un groupe de la séance' })
  @ApiOkResponse({ type: FormationGroupResponseDto })
  @ApiBadRequestResponse({ description: NOM_VIDE })
  @ApiNotFoundResponse({ description: 'Séance ou groupe introuvable' })
  @ApiConflictResponse({ description: NOM_DEJA_PRIS })
  async renameGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: FormationGroupNameRequestDto,
    @Req() request: Request,
  ): Promise<FormationGroupRecord> {
    return this.groups.rename(id, request.user!.sub, groupId, dto.name);
  }

  @Patch('sessions/:id/participants/:participantId/group')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PilotageDeSeance()
  @ApiOperation({ summary: 'Affecte un participant à un groupe de la séance' })
  @ApiNoContentResponse({ description: 'Participant affecté' })
  @ApiNotFoundResponse({
    description: 'Séance, groupe ou participant introuvable dans la séance',
  })
  async assignGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() dto: AssignFormationGroupRequestDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.groups.assign(id, request.user!.sub, participantId, dto.groupId);
  }

  @Delete('sessions/:id/participants/:participantId/group')
  @HttpCode(HttpStatus.NO_CONTENT)
  @PilotageDeSeance()
  @ApiOperation({ summary: 'Retire un participant de son groupe' })
  @ApiNoContentResponse({ description: 'Participant sans groupe' })
  @ApiNotFoundResponse({
    description: 'Séance ou participant introuvable dans la séance',
  })
  async unassignGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.groups.assign(id, request.user!.sub, participantId, null);
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
