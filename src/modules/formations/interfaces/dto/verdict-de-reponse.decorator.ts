import { ApiProperty } from '@nestjs/swagger';

export function VerdictDeReponse(): PropertyDecorator {
  return ApiProperty({
    description:
      'Verdict de la reponse, null tant que l ecran d un vote a deux tours n est pas revele',
    example: false,
    nullable: true,
    type: Boolean,
  });
}
