import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { OpenSessionRequestDto as OpenSessionServieRequestDto } from '../open-session.request.dto';

export class OpenSessionRequestDto extends OpenSessionServieRequestDto {
  @ApiPropertyOptional({
    description: 'Nombre maximal de participants, 40 par defaut',
    minimum: 1,
    maximum: 60,
    example: 40,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  capacite?: number;
}
