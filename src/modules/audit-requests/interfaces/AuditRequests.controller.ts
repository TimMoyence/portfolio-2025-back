import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateAuditRequestsUseCase } from '../application/CreateAuditRequests.useCase';
import { AuditRequestDto } from '../application/dto/AuditRequest.dto';
import { AuditRequestResponseDto } from './dto/audit-request.response.dto';

@Controller('audit-requests')
export class AuditRequestsController {
  constructor(private readonly createUseCase: CreateAuditRequestsUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: AuditRequestResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Body() dto: AuditRequestDto,
    @Req() req: Request,
  ): Promise<AuditRequestResponseDto> {
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

    const responseDto = new AuditRequestResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = response.httpCode;
    responseDto.auditId = response.auditId;
    responseDto.status = response.status;
    return responseDto;
  }
}
