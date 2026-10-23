import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { PARAMETRE_DU_JETON } from '../../../common/domain/lien-avec-jeton';
import {
  DOCUMENTATION_D_UN_JETON_DE_LIEN,
  JetonDuLienEnRequete,
  RefusDeLienDocumente,
} from '../../../common/interfaces/security/jeton-de-lien.pipe';
import { FORME_D_UN_JETON_EMIS } from '../../../common/domain/crypto/TokenHash';
import { ConfirmAuditRequestUseCase } from '../application/ConfirmAuditRequest.useCase';
import { AuditConfirmeResponseDto } from './dto/audit-confirme.response.dto';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { FluxDEvenements } from '../../../common/interfaces/http/flux-d-evenements.decorator';
import { EVENEMENTS_DU_FLUX_D_AUDIT } from './dto/evenements-du-flux.response.dto';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { provenanceDeLaRequete } from '../../../common/interfaces/security/client-ip.util';
import {
  FormulairePublic,
  RoutePublique,
} from '../../../common/interfaces/security/formulaire-public.decorator';
import { CreateAuditRequestCommand } from '../application/dto/CreateAuditRequest.command';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';
import { AuditLocale, localeFromUrlPath } from '../domain/audit-locale.util';
import { CreateAuditRequestsUseCase } from '../application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../application/StreamAuditEvents.useCase';
import { AuditRequestRequestDto } from './dto/audit-request.request.dto';
import { AuditRequestResponseDto } from './dto/audit-request.response.dto';
import { AuditSummaryResponseDto } from './dto/audit-summary.response.dto';

@ApiTags('audits')
@Controller('audits')
@ApiExtraModels(...Object.values(EVENEMENTS_DU_FLUX_D_AUDIT))
export class AuditsController {
  constructor(
    private readonly createUseCase: CreateAuditRequestsUseCase,
    private readonly confirmUseCase: ConfirmAuditRequestUseCase,
    private readonly summaryUseCase: GetAuditSummaryUseCase,
    private readonly streamUseCase: StreamAuditEventsUseCase,
  ) {}

  @FormulairePublic(3)
  @ApiOperation({
    summary: "Soumettre une demande d'audit de site web (acces public)",
  })
  @ApiCreatedResponse({ type: AuditRequestResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  async create(
    @Body() dto: AuditRequestRequestDto,
    @Req() req: Request,
  ): Promise<AuditRequestResponseDto> {
    const command: CreateAuditRequestCommand = {
      websiteName: dto.websiteName,
      contactMethod: dto.contactMethod,
      contactValue: dto.contactValue,
      locale: this.resolveLocale(dto.locale, req),
      ...provenanceDeLaRequete(req),
    };

    const response = await this.createUseCase.execute(command);

    const responseDto = new AuditRequestResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = HttpStatus.CREATED;
    responseDto.auditId = response.auditId;
    responseDto.status = response.status;
    responseDto.heuresDeValiditeDeLaConfirmation =
      response.heuresDeValiditeDeLaConfirmation;
    return responseDto;
  }

  @RoutePublique()
  @Post('confirmation')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({
    summary:
      "Confirmer une demande d'audit par le lien recu : l'audit ne demarre qu'apres",
  })
  @ApiQuery({ name: PARAMETRE_DU_JETON, ...DOCUMENTATION_D_UN_JETON_DE_LIEN })
  @ApiOkResponse({ type: AuditConfirmeResponseDto })
  @RefusDeLienDocumente()
  confirm(
    @JetonDuLienEnRequete(FORME_D_UN_JETON_EMIS) jeton: string,
  ): Promise<AuditConfirmeResponseDto> {
    return this.confirmUseCase.execute(jeton);
  }

  @RoutePublique()
  @Get(':id/summary')
  @ApiOperation({ summary: "Recuperer le resume d'un audit" })
  @ApiOkResponse({ type: AuditSummaryResponseDto })
  async summary(
    @Param('id', ParseUUIDPipe) auditId: string,
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

  @Public()
  @SkipThrottle()
  @FluxDEvenements(
    ':id/stream',
    "Flux SSE des evenements d'audit en temps reel",
    EVENEMENTS_DU_FLUX_D_AUDIT,
  )
  @ApiOperation({ summary: "Flux SSE des evenements d'avancement d'un audit" })
  stream(
    @Param('id', ParseUUIDPipe) auditId: string,
  ): Observable<MessageEvent> {
    return this.streamUseCase.execute(auditId);
  }

  private resolveLocale(requestedLocale: unknown, req: Request): AuditLocale {
    if (requestedLocale) {
      return LocaleCode.resolve(requestedLocale).value;
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

    return LocaleCode.resolve(req.get('accept-language')).value;
  }
}
