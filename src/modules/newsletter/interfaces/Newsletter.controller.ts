import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { FORME_D_UN_JETON_EMIS } from '../../../common/domain/crypto/TokenHash';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  FormulairePublic,
  LienPublic,
} from '../../../common/interfaces/security/anti-robot/formulaire-public.decorator';
import {
  JetonDuLienEnRequete,
  RefusDeLienDocumente,
} from '../../../common/interfaces/security/jeton-de-lien.pipe';
import { ConfirmSubscriptionUseCase } from '../application/ConfirmSubscription.useCase';
import { SubscribeNewsletterUseCase } from '../application/SubscribeNewsletter.useCase';
import { UnsubscribeNewsletterUseCase } from '../application/UnsubscribeNewsletter.useCase';
import {
  AbonnementNewsletterResponseDto,
  ConfirmationNewsletterResponseDto,
  DesabonnementNewsletterResponseDto,
  SubscribeNewsletterRequestDto,
} from './dto/newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(
    private readonly abonnement: SubscribeNewsletterUseCase,
    private readonly confirmation: ConfirmSubscriptionUseCase,
    private readonly desabonnement: UnsubscribeNewsletterUseCase,
  ) {}

  @FormulairePublic(3, 'subscribe')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'S abonner a la newsletter (double opt-in)' })
  @ApiAcceptedResponse({ type: AbonnementNewsletterResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  subscribe(
    @Body() dto: SubscribeNewsletterRequestDto,
  ): Promise<AbonnementNewsletterResponseDto> {
    return this.abonnement.execute({
      email: dto.email,
      locale: dto.locale,
      termsVersion: dto.termsVersion,
      termsAcceptedAt: new Date(),
    });
  }

  @LienPublic()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer un abonnement par son lien' })
  @ApiOkResponse({ type: ConfirmationNewsletterResponseDto })
  @RefusDeLienDocumente()
  confirm(
    @JetonDuLienEnRequete(FORME_D_UN_JETON_EMIS) jeton: string,
  ): Promise<ConfirmationNewsletterResponseDto> {
    return this.confirmation.execute(jeton);
  }

  @LienPublic()
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Se desabonner par son lien, depuis la page ou en un clic (RFC 8058)',
  })
  @ApiOkResponse({ type: DesabonnementNewsletterResponseDto })
  @RefusDeLienDocumente()
  unsubscribe(
    @JetonDuLienEnRequete() jeton: string,
  ): Promise<DesabonnementNewsletterResponseDto> {
    return this.desabonnement.execute(jeton);
  }
}
