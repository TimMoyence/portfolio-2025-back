import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBudgetGroupDto {
  @ApiProperty({ example: 'Budget couple T&M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
