import { ApiProperty } from '@nestjs/swagger';
import type { SebastianGoal } from '../../domain/SebastianGoal';

/** DTO de reponse pour un objectif de consommation. */
export class GoalResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() category: string;
  @ApiProperty() targetQuantity: number;
  @ApiProperty() period: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: string;

  /** Convertit une entite domaine en DTO de reponse. */
  static fromDomain(goal: SebastianGoal): GoalResponseDto {
    const dto = new GoalResponseDto();
    dto.id = goal.id!;
    dto.userId = goal.userId;
    dto.category = goal.category;
    dto.targetQuantity = Number(goal.targetQuantity);
    dto.period = goal.period;
    dto.isActive = goal.isActive;
    dto.createdAt = goal.createdAt?.toISOString() ?? '';
    return dto;
  }
}
