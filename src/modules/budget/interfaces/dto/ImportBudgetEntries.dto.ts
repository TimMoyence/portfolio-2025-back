import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ImportBudgetEntriesDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Contenu CSV brut' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  csvContent: string;
}
