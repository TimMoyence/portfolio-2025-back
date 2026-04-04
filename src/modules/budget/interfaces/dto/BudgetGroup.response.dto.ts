import { ApiProperty } from '@nestjs/swagger';

export class BudgetGroupResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() ownerId: string;
  @ApiProperty() createdAt: string;
}
