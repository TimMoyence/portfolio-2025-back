import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** DTO de reponse pour une entree recurrente de budget. */
export class RecurringEntryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() groupId: string;
  @ApiProperty() createdByUserId: string;
  @ApiPropertyOptional() categoryId: string | null;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty() type: string;
  @ApiProperty() frequency: string;
  @ApiPropertyOptional() dayOfMonth: number | null;
  @ApiPropertyOptional() dayOfWeek: number | null;
  @ApiProperty() startDate: string;
  @ApiPropertyOptional() endDate: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: string;
}
