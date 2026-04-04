import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() groupId: string | null;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
  @ApiProperty() icon: string;
  @ApiProperty() budgetType: string;
  @ApiProperty() budgetLimit: number;
  @ApiProperty() displayOrder: number;
}
