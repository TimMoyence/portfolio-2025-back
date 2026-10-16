import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfirmSubscriptionUseCase } from '../application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../application/SubscribeNewsletter.useCase';
import {
  UnsubscribeNewsletterUseCase,
  type UnsubscribeNewsletterOptions,
} from '../application/UnsubscribeNewsletter.useCase';
import { SubscribeNewsletterRequestDto } from './dto/subscribe-newsletter.request.dto';
import { SubscribeNewsletterResponseDto } from './dto/subscribe-newsletter.response.dto';
import {
  FormulairePublic,
  LienPublic,
} from '../../../common/interfaces/security/formulaire-public.decorator';
import {
  JetonDuLienEnRequete,
  RefusDeLienDocumente,
} from '../../../common/interfaces/security/jeton-de-lien.pipe';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  private readonly logger = new Logger(NewsletterController.name);

  constructor(
    private readonly subscribe: SubscribeNewsletterUseCase,
    private readonly confirm: ConfirmSubscriptionUseCase,
    private readonly unsubscribe: UnsubscribeNewsletterUseCase,
  ) {}

  @FormulairePublic(3, 'subscribe')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Inscription a la newsletter (double opt-in, acces public, 3 req/h/IP)',
  })
  @ApiAcceptedResponse({ type: SubscribeNewsletterResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
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

    const response = new SubscribeNewsletterResponseDto();
    response.message =
      'Si vous n\u2019etes pas encore inscrit, un email de confirmation vient d\u2019etre envoye.';
    return response;
  }

  @LienPublic()
  @Get('confirm')
  @ApiOperation({
    summary:
      'Confirme une inscription newsletter via magic link (acces public)',
  })
  @ApiOkResponse({ description: 'Inscription confirmee' })
  @RefusDeLienDocumente()
  async confirmEndpoint(
    @JetonDuLienEnRequete() token: string,
  ): Promise<{ status: string }> {
    const result = await this.confirm.execute(token);
    return { status: result.status };
  }

  @LienPublic()
  @Get('unsubscribe')
  @ApiOperation({
    summary: 'Desabonne un utilisateur via son token (acces public)',
  })
  @ApiOkResponse({ description: 'Desabonnement confirme' })
  @RefusDeLienDocumente()
  async unsubscribeEndpoint(
    @JetonDuLienEnRequete() token: string,
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
  @LienPublic()
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desabonnement en un clic RFC 8058 (declenche par le client mail)',
  })
  @ApiOkResponse({ description: 'Desabonnement confirme' })
  @RefusDeLienDocumente()
  async unsubscribeOneClickEndpoint(
    @JetonDuLienEnRequete() token: string,
  ): Promise<{ status: string }> {
    this.logger.log('Newsletter one-click unsubscribe received');
    return this.handleUnsubscribe(token, { sendAck: false });
  }

  private async handleUnsubscribe(
    token: string,
    options: UnsubscribeNewsletterOptions,
  ): Promise<{ status: string }> {
    const result = await this.unsubscribe.execute(token, options);
    return { status: result.status };
  }
}
