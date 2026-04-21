import { ApiProperty } from '@nestjs/swagger';

/**
 * Reponse volontairement opaque de `POST /newsletter/subscribe`. On ne
 * divulgue ni `created`, ni `status` : un attaquant ne doit pas pouvoir
 * inferer si un email est deja inscrit, confirme ou desabonne depuis
 * cet endpoint public (oracle d'enumeration RGPD).
 */
export class SubscribeNewsletterResponseDto {
  @ApiProperty({
    description:
      'Message generique ne trahissant pas la base de contacts (RGPD-friendly)',
    example:
      'Si vous n\u2019etes pas encore inscrit, un email de confirmation vient d\u2019etre envoye.',
  })
  message: string;
}
