import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** DTO HTTP pour les reponses goals enrichis avec progression. */
export class BudgetGoalWithProgressResponseDto {
  @ApiProperty({ example: 'goal-uuid' })
  id: string;

  @ApiProperty({ example: 'group-uuid' })
  groupId: string;

  @ApiProperty({ example: 'user-uuid' })
  createdByUserId: string;

  @ApiProperty({ example: 'Vacances ete' })
  name: string;

  @ApiProperty({ enum: ['SAVINGS', 'SPENDING_LIMIT', 'CATEGORY_LIMIT'] })
  kind: string;

  @ApiProperty({ example: 1000 })
  targetAmount: number;

  @ApiPropertyOptional({ example: 'category-uuid', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z', nullable: true })
  deadline: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 500 })
  currentAmount: number;

  @ApiProperty({ example: 50 })
  progressPercent: number;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  updatedAt: string;
}
