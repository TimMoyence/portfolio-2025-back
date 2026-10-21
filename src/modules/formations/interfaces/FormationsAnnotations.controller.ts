import { Body, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { compteConnecte } from '../../../common/interfaces/auth/compte-connecte';
import { ManageTeacherAnnotationsUseCase } from '../application/ManageTeacherAnnotations.useCase';
import { SaveTeacherAnnotationRequestDto } from './dto/save-teacher-annotation.request.dto';
import {
  TeacherAnnotationResponseDto,
  TeacherAnnotationsResponseDto,
} from './dto/teacher-annotations.response.dto';
import {
  ControleurFormateur,
  LectureDeSeance,
  PilotageDeSeance,
} from './formations-acces';

@ControleurFormateur()
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
  ): Promise<TeacherAnnotationsResponseDto> {
    return {
      annotations: await this.annotations.list(id, compteConnecte(request)),
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
  ): Promise<TeacherAnnotationResponseDto> {
    return this.annotations.save(id, compteConnecte(request).id, {
      screenId: dto.screenId,
      note: dto.note,
    });
  }
}
