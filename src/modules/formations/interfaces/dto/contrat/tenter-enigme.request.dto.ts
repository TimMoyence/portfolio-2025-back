import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { DureeDeReponse } from '../duree-de-reponse.decorator';

export class TenterEnigmeRequestDto {
  @ApiProperty({ example: 'enigme-1' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  enigmeId: string;

  @ApiProperty({
    description:
      'Saisie brute, lue par lireNombreSaisi pour une solution chiffree',
    example: '142 920',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  reponse: string;

  @DureeDeReponse(42000)
  dureeMs: number;
}
