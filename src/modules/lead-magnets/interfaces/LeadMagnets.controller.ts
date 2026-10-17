import { Body, Controller, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequestToolkitUseCase } from '../application/RequestToolkit.useCase';
import type { RequestToolkitCommand } from '../application/dto/RequestToolkit.command';
import { GetToolkitByTokenUseCase } from '../application/queries/GetToolkitByToken.useCase';
import { LeadMagnetResponseDto } from './dto/lead-magnet.response.dto';
import { RequestToolkitRequestDto } from './dto/request-toolkit.request.dto';
import { ToolkitPageResponseDto } from './dto/toolkit-page.response.dto';
import {
  FormulairePublic,
  LienPublic,
} from '../../../common/interfaces/security/formulaire-public.decorator';
import {
  JetonDuLienEnChemin,
  RefusDeLienDocumente,
  SEGMENT_DU_JETON,
} from '../../../common/interfaces/security/jeton-de-lien.pipe';

@ApiTags('lead-magnets')
@Controller('lead-magnets')
export class LeadMagnetsController {
  constructor(
    private readonly requestToolkit: RequestToolkitUseCase,
    private readonly getToolkitByToken: GetToolkitByTokenUseCase,
  ) {}

  @FormulairePublic(3, 'formations-toolkit')
  @ApiOperation({
    summary: 'Demander la boite a outils IA par email (acces public, 3 req/h)',
  })
  @ApiCreatedResponse({ type: LeadMagnetResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
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
    responseDto.accessToken = response.accessToken;
    return responseDto;
  }

  @LienPublic()
  @Get(`toolkit/${SEGMENT_DU_JETON}`)
  @ApiOperation({
    summary:
      'Recuperer le contenu personnalise du guide par token (acces public, 10 req/min)',
  })
  @ApiOkResponse({ type: ToolkitPageResponseDto })
  @RefusDeLienDocumente()
  async getByToken(
    @JetonDuLienEnChemin() token: string,
  ): Promise<ToolkitPageResponseDto> {
    const content = await this.getToolkitByToken.execute({
      accessToken: token,
    });
    return ToolkitPageResponseDto.fromContent(content);
  }
}
