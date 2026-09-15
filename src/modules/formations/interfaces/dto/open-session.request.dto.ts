import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class OpenSessionRequestDto {
  @ApiProperty({ example: 'b2-01-traitement-information-chiffree' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MinLength(1)
  @MaxLength(120)
  courseSlug: string;
}
