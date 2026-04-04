import { Body, Controller, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import type { Request } from 'express';
import { CreateCookieConsentsUseCase } from '../application/CreateCookieConsents.useCase';
import { CreateCookieConsentCommand } from '../application/dto/CreateCookieConsent.command';
import { CookieConsentResponseDto } from './dto/cookie-consent.response.dto';
import { CookieConsentRequestDto } from './dto/cookie-consent.request.dto';

@ApiTags('cookie-consents')
@Controller('cookie-consents')
export class CookieConsentsController {
  constructor(private readonly createUseCase: CreateCookieConsentsUseCase) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Enregistrer un consentement cookie (acces public)',
  })
  @ApiCreatedResponse({ type: CookieConsentResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  async create(
    @Body() dto: CookieConsentRequestDto,
    @Req() req: Request,
  ): Promise<CookieConsentResponseDto> {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    const command: CreateCookieConsentCommand = {
      policyVersion: dto.policyVersion,
      locale: dto.locale,
      region: dto.region,
      source: dto.source,
      action: dto.action,
      preferences: dto.preferences,
      ip: ip ?? req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      referer: req.headers['referer'] ?? null,
    };

    const response = await this.createUseCase.execute(command);

    const responseDto = new CookieConsentResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = HttpStatus.CREATED;
    return responseDto;
  }
}
