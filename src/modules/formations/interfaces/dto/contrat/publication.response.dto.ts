import { ApiProperty } from '@nestjs/swagger';

export class PublicationResponseDto {
  @ApiProperty({ example: 'b2-01-traitement-information-chiffree' })
  slug: string;

  @ApiProperty({ example: 3 })
  versionPubliee: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date de la bascule de publication',
  })
  publieeLe: string;
}
