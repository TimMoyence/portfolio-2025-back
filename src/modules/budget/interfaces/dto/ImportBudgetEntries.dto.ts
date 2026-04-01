import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ImportBudgetEntriesDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Contenu CSV brut' })
  @IsString()
  @IsNotEmpty()
  csvContent: string;
}
