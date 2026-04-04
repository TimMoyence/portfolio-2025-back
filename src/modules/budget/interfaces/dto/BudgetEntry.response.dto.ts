import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetEntryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() groupId: string;
  @ApiProperty() createdByUserId: string;
  @ApiPropertyOptional() categoryId: string | null;
  @ApiProperty() date: string;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty() type: string;
  @ApiProperty() state: string;
  @ApiProperty() createdAt: string;
}
