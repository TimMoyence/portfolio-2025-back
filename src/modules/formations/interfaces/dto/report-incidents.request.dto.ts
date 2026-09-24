import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
} from 'class-validator';
import type { ValidatorConstraintInterface } from 'class-validator';
import { MAX_INCIDENTS_PAR_ENVOI } from '../../domain/IncidentType';

const ENTREES_MAX_DU_CONTEXTE = 10;
const LONGUEUR_MAX_CLE_DU_CONTEXTE = 40;
const LONGUEUR_MAX_TEXTE_DU_CONTEXTE = 200;

function valeurScalaireBornee(valeur: unknown): boolean {
  if (typeof valeur === 'string') {
    return valeur.length <= LONGUEUR_MAX_TEXTE_DU_CONTEXTE;
  }
  return (
    typeof valeur === 'boolean' ||
    (typeof valeur === 'number' && Number.isFinite(valeur))
  );
}

@ValidatorConstraint({ name: 'contexteDIncidentBorne', async: false })
class ContexteDIncidentBorne implements ValidatorConstraintInterface {
  validate(valeur: unknown): boolean {
    if (
      typeof valeur !== 'object' ||
      valeur === null ||
      Array.isArray(valeur)
    ) {
      return false;
    }
    const entrees = Object.entries(valeur);
    return (
      entrees.length <= ENTREES_MAX_DU_CONTEXTE &&
      entrees.every(
        ([cle, contenu]) =>
          cle.length > 0 &&
          cle.length <= LONGUEUR_MAX_CLE_DU_CONTEXTE &&
          valeurScalaireBornee(contenu),
      )
    );
  }

  defaultMessage(): string {
    return `contexte doit etre un objet plat d au plus ${ENTREES_MAX_DU_CONTEXTE} entrees scalaires, textes de ${LONGUEUR_MAX_TEXTE_DU_CONTEXTE} caracteres au plus`;
  }
}

export class IncidentEntryDto {
  @ApiProperty({ example: 'tab_hidden' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  type: string;

  @ApiPropertyOptional({ example: { duree: 1200 } })
  @IsOptional()
  @Validate(ContexteDIncidentBorne)
  contexte?: Record<string, unknown>;

  @ApiProperty({ example: '2026-09-11T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  horodatage: Date;
}

export class ReportIncidentsRequestDto {
  @ApiProperty({ type: [IncidentEntryDto] })
  @IsArray()
  @ArrayMaxSize(MAX_INCIDENTS_PAR_ENVOI)
  @ValidateNested({ each: true })
  @Type(() => IncidentEntryDto)
  incidents: IncidentEntryDto[];
}
