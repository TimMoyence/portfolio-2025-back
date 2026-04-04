import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsPositive } from 'class-validator';

/** DTO de requete pour creer un objectif de consommation. */
export class CreateGoalDto {
  @ApiProperty({ enum: ['alcohol', 'coffee'], example: 'coffee' })
  @IsIn(['alcohol', 'coffee'])
  category: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsPositive()
  targetQuantity: number;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly'], example: 'daily' })
  @IsIn(['daily', 'weekly', 'monthly'])
  period: string;
}
