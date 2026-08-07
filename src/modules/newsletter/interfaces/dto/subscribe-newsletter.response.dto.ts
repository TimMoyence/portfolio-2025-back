import { ApiProperty } from '@nestjs/swagger';

export class SubscribeNewsletterResponseDto {
  @ApiProperty({
    description:
      'Message generique ne trahissant pas la base de contacts (RGPD-friendly)',
    example:
      'Si vous n\u2019etes pas encore inscrit, un email de confirmation vient d\u2019etre envoye.',
  })
  message: string;
}
