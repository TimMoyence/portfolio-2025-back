import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO d'import CSV. La limite passe de 5 MB a 500 KB
 * (HIGH-2 audit 2026-05-09) car le parser actuel etait O(n) avec
 * concatenation de strings et bloquait l'event-loop sur 5 MB. La
 * limite reste alignee avec le `bodyParser.json({ limit })` de
 * `main.ts` pour eviter qu'un body soit accepte a la couche HTTP mais
 * rejete plus tard par class-validator (UX confuse).
 */
export class ImportBudgetEntriesDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Contenu CSV brut, max 500_000 caracteres' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500_000)
  csvContent: string;
}
