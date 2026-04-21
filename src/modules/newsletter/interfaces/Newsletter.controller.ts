import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import {
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
import { UnsubscribeNewsletterUseCase } from '../application/UnsubscribeNewsletter.useCase';
import { SubscribeNewsletterRequestDto } from './dto/subscribe-newsletter.request.dto';
import { SubscribeNewsletterResponseDto } from './dto/subscribe-newsletter.response.dto';

/**
 * Regex UUID v4 stricte. `ParseUUIDPipe` aurait repondu 400 — ce qui
 * constitue un oracle d'enumeration pour differencier "token non
 * conforme" d'un "token inconnu". On filtre au niveau applicatif et on
 * uniformise en 404 (comportement d'un token non trouve) pour ne pas
 * fuiter l'information aux bots.
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controleur HTTP du bounded context Newsletter.
 *
 * Trois endpoints publics :
 *  - `POST /newsletter/subscribe` : inscription double opt-in,
 *  - `GET /newsletter/confirm?token=` : confirmation via magic link,
 *  - `GET /newsletter/unsubscribe?token=` : desabonnement instantane.
 *
 * La reponse `subscribe` est volontairement generique (RGPD) : on ne
 * revele jamais si l'email existe deja en base. Le throttle est
 * calibre pour dissuader l'enumeration d'adresses.
 */
@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(
    private readonly subscribe: SubscribeNewsletterUseCase,
    private readonly confirm: ConfirmSubscriptionUseCase,
    private readonly unsubscribe: UnsubscribeNewsletterUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('subscribe')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Inscription a la newsletter (double opt-in, acces public, 3 req/h/IP)',
  })
  @ApiOkResponse({ type: SubscribeNewsletterResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiTooManyRequestsResponse({ description: 'Trop de requetes' })
  async subscribeEndpoint(
    @Body() dto: SubscribeNewsletterRequestDto,
  ): Promise<SubscribeNewsletterResponseDto> {
    await this.subscribe.execute({
      email: dto.email,
      firstName: dto.firstName,
      locale: dto.locale,
      sourceFormationSlug: dto.sourceFormationSlug,
      termsVersion: dto.termsVersion,
      termsAcceptedAt: dto.termsAcceptedAt,
    });

    // Reponse deliberement uniforme : on ne revele ni creation, ni
    // statut existant pour empecher l'enumeration cote attaquant.
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
    this.assertValidToken(token);
    const result = await this.unsubscribe.execute(token);
    return { status: result.status };
  }

  /**
   * Normalise la reponse pour les tokens mal formes : retourne 404 au
   * lieu de 400 pour eviter la distinction oracle entre "format
   * invalide" et "token inconnu".
   */
  private assertValidToken(token: string | undefined): void {
    if (!token || !UUID_V4_REGEX.test(token)) {
      throw new NotFoundException('Invalid or expired token');
    }
  }
}
