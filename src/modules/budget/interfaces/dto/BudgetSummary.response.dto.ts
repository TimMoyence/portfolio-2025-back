import { ApiProperty } from '@nestjs/swagger';

export class CategorySummaryDto {
  @ApiProperty() categoryId: string | null;
  @ApiProperty() categoryName: string;
  @ApiProperty() total: number;
  @ApiProperty() budgetLimit: number;
  @ApiProperty() remaining: number;
}

export class BudgetSummaryResponseDto {
  @ApiProperty() totalExpenses: number;
  @ApiProperty() totalIncoming: number;
  @ApiProperty({ type: [CategorySummaryDto] }) byCategory: CategorySummaryDto[];
}
