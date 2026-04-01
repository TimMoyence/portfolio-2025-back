import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID } from 'class-validator';

export class ShareBudgetDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  targetEmail: string;
}
