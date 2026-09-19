import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveTeacherAnnotationRequestDto {
  @ApiProperty({ example: 'B2-01-S11-REFLECTION' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  screenId: string;

  @ApiProperty({ example: 'Classe entière' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  groupName: string;

  @ApiProperty({ example: 'Faire expliciter la base de comparaison.' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  note: string;
}
