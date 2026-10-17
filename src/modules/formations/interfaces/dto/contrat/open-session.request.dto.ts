import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { EntierBorne } from '../../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { OpenSessionRequestDto as OpenSessionServieRequestDto } from '../open-session.request.dto';

export class OpenSessionRequestDto extends OpenSessionServieRequestDto {
  @ApiPropertyOptional({
    description: 'Nombre maximal de participants, 40 par defaut',
    example: 40,
  })
  @IsOptional()
  @EntierBorne(1, 60)
  capacite?: number;
}
