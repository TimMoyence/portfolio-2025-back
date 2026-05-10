import { ApiProperty } from '@nestjs/swagger';

/** DTO HTTP pour les reponses contribution. */
export class BudgetContributionResponseDto {
  @ApiProperty({ example: 'contrib-uuid' })
  id: string;

  @ApiProperty({ example: 'group-uuid' })
  groupId: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 5 })
  month: number;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 2500 })
  monthlySalary: number;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  updatedAt: string;
}
