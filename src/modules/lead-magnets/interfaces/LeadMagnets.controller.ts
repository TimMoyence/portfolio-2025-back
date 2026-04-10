import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { RequestToolkitUseCase } from '../application/RequestToolkit.useCase';
import type { RequestToolkitCommand } from '../application/dto/RequestToolkit.command';
import { LeadMagnetResponseDto } from './dto/lead-magnet.response.dto';
import { RequestToolkitRequestDto } from './dto/request-toolkit.request.dto';

/** Controleur HTTP pour les lead magnets (boite a outils IA). */
@ApiTags('lead-magnets')
@Controller('lead-magnets')
export class LeadMagnetsController {
  constructor(private readonly requestToolkit: RequestToolkitUseCase) {}

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
    const command: RequestToolkitCommand = {
      firstName: dto.firstName,
      email: dto.email,
      formationSlug: dto.formationSlug,
      termsVersion: dto.termsVersion,
      termsLocale: dto.termsLocale,
      termsAcceptedAt: dto.termsAcceptedAt,
    };
    const response = await this.requestToolkit.execute(command);
    const responseDto = new LeadMagnetResponseDto();
    responseDto.message = response.message;
    return responseDto;
  }
}
