import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateCookieConsentsUseCase } from '../application/CreateCookieConsents.useCase';
import { CookieConsentDto } from '../application/dto/CookieConsent.dto';
import { CookieConsentResponseDto } from './dto/cookie-consent.response.dto';

@Controller('cookie-consents')
export class CookieConsentsController {
  constructor(private readonly createUseCase: CreateCookieConsentsUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: CookieConsentResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Body() dto: CookieConsentDto,
    @Req() req: Request,
  ): Promise<CookieConsentResponseDto> {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    const response = await this.createUseCase.execute({
      ...dto,
      ip: ip ?? req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      referer: req.headers['referer'] ?? null,
    });

    const responseDto = new CookieConsentResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = response.httpCode;
    return responseDto;
  }
}
