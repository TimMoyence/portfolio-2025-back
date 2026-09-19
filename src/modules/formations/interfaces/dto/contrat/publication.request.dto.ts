import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PublierVersionRequestDto {
  @ApiProperty({
    description: 'Version du cours a publier au catalogue',
    example: 3,
  })
  @IsInt()
  @Min(1)
  version: number;
}
