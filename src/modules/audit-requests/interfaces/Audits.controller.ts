import {
  Body,
  Controller,
  Get,
  HttpStatus,
  MessageEvent,
  Param,
  Post,
  Req,
  Sse,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { CreateAuditRequestCommand } from '../application/dto/CreateAuditRequest.command';
import {
  AuditLocale,
  localeFromUrlPath,
  resolveAuditLocale,
} from '../domain/audit-locale.util';
import { CreateAuditRequestsUseCase } from '../application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../application/StreamAuditEvents.useCase';
import { AuditRequestRequestDto } from './dto/audit-request.request.dto';
import { AuditRequestResponseDto } from './dto/audit-request.response.dto';
import { AuditSummaryResponseDto } from './dto/audit-summary.response.dto';

@Controller('audits')
export class AuditsController {
  constructor(
    private readonly createUseCase: CreateAuditRequestsUseCase,
    private readonly summaryUseCase: GetAuditSummaryUseCase,
    private readonly streamUseCase: StreamAuditEventsUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: AuditRequestResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Body() dto: AuditRequestRequestDto,
    @Req() req: Request,
  ): Promise<AuditRequestResponseDto> {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    const command: CreateAuditRequestCommand = {
      websiteName: dto.websiteName,
      contactMethod: dto.contactMethod,
      contactValue: dto.contactValue,
      locale: this.resolveLocale(dto.locale, req),
      ip: ip ?? req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      referer: req.headers['referer'] ?? null,
    };

    const response = await this.createUseCase.execute(command);

    const responseDto = new AuditRequestResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = HttpStatus.CREATED;
    responseDto.auditId = response.auditId;
    responseDto.status = response.status;
    return responseDto;
  }

  @Get(':id/summary')
  @ApiOkResponse({ type: AuditSummaryResponseDto })
  async summary(
    @Param('id') auditId: string,
  ): Promise<AuditSummaryResponseDto> {
    const summary = await this.summaryUseCase.execute(auditId);
    return {
      auditId: summary.auditId,
      ready: summary.ready,
      status: summary.status,
      progress: summary.progress,
      summaryText: summary.summaryText,
      keyChecks: summary.keyChecks,
      quickWins: summary.quickWins,
      pillarScores: summary.pillarScores,
    };
  }

  @Sse(':id/stream')
  stream(@Param('id') auditId: string): Observable<MessageEvent> {
    return this.streamUseCase.execute(auditId);
  }

  private resolveLocale(requestedLocale: unknown, req: Request): AuditLocale {
    const explicit = resolveAuditLocale(requestedLocale, 'fr');
    if (requestedLocale) {
      return explicit;
    }

    const referer = req.get('referer');

    if (referer) {
      try {
        const fromPath = localeFromUrlPath(new URL(referer).pathname);
        if (fromPath) return fromPath;
      } catch {
        const fromPath = localeFromUrlPath(referer);
        if (fromPath) return fromPath;
      }
    }

    const acceptLanguage = req.get('accept-language');

    return resolveAuditLocale(acceptLanguage, 'fr');
  }
}
