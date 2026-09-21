import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class FormationGroupNameRequestDto {
  @ApiProperty({
    example: 'Groupe A',
    minLength: 1,
    maxLength: 80,
    description: 'Nom unique dans la séance, blancs de bord retirés',
  })
  @IsString()
  @Length(1, 80)
  name: string;
}
