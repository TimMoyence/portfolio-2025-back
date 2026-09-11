import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Optional,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { ConfirmSubscriptionUseCase } from '../application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../application/SubscribeNewsletter.useCase';
import {
  UnsubscribeNewsletterUseCase,
  type UnsubscribeNewsletterOptions,
} from '../application/UnsubscribeNewsletter.useCase';
import { SubscribeNewsletterRequestDto } from './dto/subscribe-newsletter.request.dto';
import { SubscribeNewsletterResponseDto } from './dto/subscribe-newsletter.response.dto';
import { PublicFormProtectionService } from '../../../common/interfaces/security/public-form-protection.service';

/**
 * Regex UUID v4 stricte (RFC 4122). Position 14 = `4` (version bit),
 * position 19 = `[89ab]` (variant bits). `ParseUUIDPipe` aurait repondu
 * 400 — ce qui constitue un oracle d'enumeration pour differencier
 * "token non conforme" d'un "token inconnu". On filtre ici et on
 * uniformise en 404 pour ne pas fuiter l'information aux bots.
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  private readonly logger = new Logger(NewsletterController.name);

  constructor(
    private readonly subscribe: SubscribeNewsletterUseCase,
    private readonly confirm: ConfirmSubscriptionUseCase,
    private readonly unsubscribe: UnsubscribeNewsletterUseCase,
    @Optional()
    private readonly formProtection = new PublicFormProtectionService(),
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('subscribe')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Inscription a la newsletter (double opt-in, acces public, 3 req/h/IP)',
  })
  @ApiAcceptedResponse({ type: SubscribeNewsletterResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiTooManyRequestsResponse({ description: 'Trop de requetes' })
  async subscribeEndpoint(
    @Body() dto: SubscribeNewsletterRequestDto,
  ): Promise<SubscribeNewsletterResponseDto> {
    this.formProtection.assertHuman({
      honeypot: dto.website,
      formStartedAt: dto.formStartedAt,
    });
    await this.subscribe.execute({
      email: dto.email,
      firstName: dto.firstName,
      locale: dto.locale,
      sourceFormationSlug: dto.sourceFormationSlug,
      termsVersion: dto.termsVersion,
      termsAcceptedAt: dto.termsAcceptedAt,
    });

    const response = new SubscribeNewsletterResponseDto();
    response.message =
      'Si vous n\u2019etes pas encore inscrit, un email de confirmation vient d\u2019etre envoye.';
    return response;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('confirm')
  @ApiOperation({
    summary:
      'Confirme une inscription newsletter via magic link (acces public)',
  })
  @ApiOkResponse({ description: 'Inscription confirmee' })
  @ApiNotFoundResponse({ description: 'Token invalide ou expire' })
  async confirmEndpoint(
    @Query('token') token: string,
  ): Promise<{ status: string }> {
    this.assertValidToken(token);
    const result = await this.confirm.execute(token);
    return { status: result.status };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('unsubscribe')
  @ApiOperation({
    summary: 'Desabonne un utilisateur via son token (acces public)',
  })
  @ApiOkResponse({ description: 'Desabonnement confirme' })
  @ApiNotFoundResponse({ description: 'Token invalide ou expire' })
  async unsubscribeEndpoint(
    @Query('token') token: string,
  ): Promise<{ status: string }> {
    return this.handleUnsubscribe(token, { sendAck: true });
  }

  /**
   * Desabonnement en un clic (RFC 8058), declenche par le client mail.
   *
   * Gmail et consorts envoient un POST non authentifie, sans corps utile,
   * sur l'URL de l'en-tete `List-Unsubscribe` quand
   * `List-Unsubscribe-Post` est present. Le desabonnement doit aboutir
   * sans page intermediaire ni confirmation : c'est la contrepartie de
   * l'en-tete annonce par `NewsletterMailerService`.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desabonnement en un clic RFC 8058 (declenche par le client mail)',
  })
  @ApiOkResponse({ description: 'Desabonnement confirme' })
  @ApiNotFoundResponse({ description: 'Token invalide ou expire' })
  async unsubscribeOneClickEndpoint(
    @Query('token') token: string,
  ): Promise<{ status: string }> {
    this.logger.log('Newsletter one-click unsubscribe received');
    return this.handleUnsubscribe(token, { sendAck: false });
  }

  private async handleUnsubscribe(
    token: string,
    options: UnsubscribeNewsletterOptions,
  ): Promise<{ status: string }> {
    this.assertValidToken(token);
    const result = await this.unsubscribe.execute(token, options);
    return { status: result.status };
  }

  private assertValidToken(token: string | undefined): void {
    if (!token || !UUID_V4_REGEX.test(token)) {
      throw new NotFoundException('Invalid or expired token');
    }
  }
}
