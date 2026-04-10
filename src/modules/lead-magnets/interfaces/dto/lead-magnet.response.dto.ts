import { ApiProperty } from '@nestjs/swagger';

export class LeadMagnetResponseDto {
  @ApiProperty({
    example: 'Votre boite a outils a ete envoyee a marie@example.com',
  })
  message: string;
}
