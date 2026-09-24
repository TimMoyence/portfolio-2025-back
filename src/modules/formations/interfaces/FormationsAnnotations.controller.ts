import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ManageTeacherAnnotationsUseCase } from '../application/ManageTeacherAnnotations.useCase';
import type { TeacherAnnotationRecord } from '../domain/ITeacherAnnotations.repository';
import { SaveTeacherAnnotationRequestDto } from './dto/save-teacher-annotation.request.dto';
import {
  TeacherAnnotationResponseDto,
  TeacherAnnotationsResponseDto,
} from './dto/teacher-annotations.response.dto';
import {
  acteurDe,
  LectureDeSeance,
  PilotageDeSeance,
  ROLE_FORMATEUR,
} from './formations-acces';

@ApiTags('formations')
@ApiBearerAuth()
@Controller('formations')
@UseGuards(RolesGuard)
@Roles(ROLE_FORMATEUR)
export class FormationsAnnotationsController {
  constructor(private readonly annotations: ManageTeacherAnnotationsUseCase) {}

  @Get('sessions/:id/annotations')
  @LectureDeSeance()
  @ApiOperation({
    summary: 'Liste les annotations du formateur propriétaire de la séance',
  })
  @ApiOkResponse({ type: TeacherAnnotationsResponseDto })
  async getAnnotations(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<{ annotations: readonly TeacherAnnotationRecord[] }> {
    return {
      annotations: await this.annotations.list(id, acteurDe(request)),
    };
  }

  @Post('sessions/:id/annotations')
  @PilotageDeSeance()
  @ApiOperation({
    summary:
      'Enregistre l annotation d un écran, la dernière écriture remplace la précédente',
  })
  @ApiCreatedResponse({ type: TeacherAnnotationResponseDto })
  @ApiBadRequestResponse({
    description:
      'Note vide une fois les blancs retirés, ou ECRAN_INCONNU : écran absent du cours de la séance',
  })
  async saveAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveTeacherAnnotationRequestDto,
    @Req() request: Request,
  ): Promise<TeacherAnnotationRecord> {
    return this.annotations.save(id, request.user!.sub, {
      screenId: dto.screenId,
      note: dto.note,
    });
  }
}
