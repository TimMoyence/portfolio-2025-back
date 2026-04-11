import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { RequestToolkitUseCase } from '../application/RequestToolkit.useCase';
import type { RequestToolkitCommand } from '../application/dto/RequestToolkit.command';
import { GetToolkitByTokenUseCase } from '../application/queries/GetToolkitByToken.useCase';
import type { InteractionProfile } from '../domain/InteractionProfile';
import { LeadMagnetResponseDto } from './dto/lead-magnet.response.dto';
import { RequestToolkitRequestDto } from './dto/request-toolkit.request.dto';
import { ToolkitPageResponseDto } from './dto/toolkit-page.response.dto';

/** Controleur HTTP pour les lead magnets (boite a outils IA). */
@ApiTags('lead-magnets')
@Controller('lead-magnets')
export class LeadMagnetsController {
  constructor(
    private readonly requestToolkit: RequestToolkitUseCase,
    private readonly getToolkitByToken: GetToolkitByTokenUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('formations-toolkit')
  @ApiOperation({
    summary: 'Demander la boite a outils IA par email (acces public, 3 req/h)',
  })
  @ApiCreatedResponse({ type: LeadMagnetResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiTooManyRequestsResponse({ description: 'Trop de requetes' })
  async create(
    @Body() dto: RequestToolkitRequestDto,
  ): Promise<LeadMagnetResponseDto> {
    const profile: InteractionProfile | undefined = dto.profile
      ? {
          aiLevel: dto.profile.aiLevel ?? null,
          toolsAlreadyUsed: dto.profile.toolsAlreadyUsed ?? [],
          budgetTier: dto.profile.budgetTier ?? null,
          sector: dto.profile.sector ?? null,
          generatedPrompt: dto.profile.generatedPrompt ?? null,
        }
      : undefined;

    const command: RequestToolkitCommand = {
      firstName: dto.firstName,
      email: dto.email,
      formationSlug: dto.formationSlug,
      termsVersion: dto.termsVersion,
      termsLocale: dto.termsLocale,
      termsAcceptedAt: dto.termsAcceptedAt,
      profile,
    };
    const response = await this.requestToolkit.execute(command);
    const responseDto = new LeadMagnetResponseDto();
    responseDto.message = response.message;
    responseDto.accessToken = response.accessToken;
    return responseDto;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('toolkit/:token')
  @ApiOperation({
    summary:
      'Recuperer le contenu personnalise du guide par token (acces public, 10 req/min)',
  })
  @ApiOkResponse({ type: ToolkitPageResponseDto })
  @ApiNotFoundResponse({ description: 'Token introuvable' })
  @ApiTooManyRequestsResponse({ description: 'Trop de requetes' })
  async getByToken(
    @Param('token', ParseUUIDPipe) token: string,
  ): Promise<ToolkitPageResponseDto> {
    const content = await this.getToolkitByToken.execute({
      accessToken: token,
    });
    return ToolkitPageResponseDto.fromContent(content);
  }
}
