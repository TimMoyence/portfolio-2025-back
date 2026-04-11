import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadMagnetResponseDto {
  @ApiProperty({
    example: 'Votre boite a outils a ete envoyee a marie@example.com',
  })
  message: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: "Token d'acces a la page personnalisee du guide",
  })
  accessToken?: string;
}
