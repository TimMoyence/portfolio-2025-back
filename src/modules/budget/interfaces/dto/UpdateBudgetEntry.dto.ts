import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateBudgetEntryDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
