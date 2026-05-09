import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

/**
 * DTO query pour `GET /budget/export/pdf`. Valide strictement
 * `groupId`/`month`/`year` afin d'eviter une header injection dans le
 * `Content-Disposition` (HIGH-4 audit 2026-05-09 : query bruts dans le
 * filename) et de garantir une plage saine pour l'export.
 *
 * `Type(() => Number)` declenche la coercion class-transformer (les
 * query strings express sont par defaut des strings).
 */
export class ExportBudgetPdfQueryDto {
  @ApiProperty({ example: '00000000-0000-4000-8000-000000000001' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 6, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
