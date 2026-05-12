import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO de mise a jour partielle d'une categorie de budget.
 *
 * Aligne sur `CreateBudgetCategoryDto` pour les contraintes regex
 * `color`/`icon` et bornes numeriques `budgetLimit` (HIGH-3 + HIGH-1
 * audit 2026-05-09 : eviter stored XSS/CSS injection et Infinity/NaN
 * via update). Sans ce durcissement, un attaquant pouvait
 * `PATCH /budget/categories/:id { "color": "javascript:alert(1)" }`.
 */
export class UpdateBudgetCategoryDto {
  @ApiPropertyOptional({ example: 'Alimentation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '#22C55E' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ example: 'shopping-cart' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ enum: ['FIXED', 'VARIABLE'], example: 'VARIABLE' })
  @IsOptional()
  @IsIn(['FIXED', 'VARIABLE'])
  budgetType?: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({ example: 600, minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  budgetLimit?: number;

  /**
   * Requis uniquement quand la categorie ciblee par l'URL est une
   * categorie par defaut (`group_id IS NULL`). Permet au use case de
   * cloner la categorie pour le groupe specifie au lieu de modifier la
   * default globale (copy-on-write transparent pour le client).
   */
  @ApiPropertyOptional({
    example: 'e97273f9-f67d-450a-b18f-08ecff3520c0',
    description:
      'Id du groupe — requis pour modifier une categorie par defaut (clone auto).',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
