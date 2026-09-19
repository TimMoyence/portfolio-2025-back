import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
  OmitType,
} from '@nestjs/swagger';
import type { Diffusion } from '../../../domain/contrats/cours';
import { DIFFUSIONS } from '../../../domain/contrats/cours';
import type {
  CorrigeEcranPresentateur,
  DerouleCours,
  EcranDeroule,
} from '../../../domain/contrats/deroule';
import type { FormeFormule } from '../../../domain/cours/Corrige';
import {
  CorrigePresentateurResponseDto,
  GuideFormateurResponseDto,
} from '../deroule.response.dto';
import { OptionPubliqueResponseDto } from './rappels.response.dto';
import { EcranPublicResponseDto, SujetResponseDto } from './sujet.response.dto';

export class ToleranceResponseDto {
  @ApiProperty({ enum: ['relative', 'absolue', 'decimales'] })
  type: 'relative' | 'absolue' | 'decimales';

  @ApiProperty({ example: 0.0001 })
  valeur: number;
}

class FormeMemeQueResponseDto {
  @ApiProperty({
    description: 'Cellule dont la forme R1C1 doit etre reprise',
    example: 'D2',
  })
  memeQue: string;
}

@ApiExtraModels(FormeMemeQueResponseDto)
export class AttenduFeuillePresentateurResponseDto {
  @ApiProperty({ example: 'E2' })
  reference: string;

  @ApiProperty({ example: '=C2/$C$5' })
  formuleReference: string;

  @ApiProperty({ example: 0.345217 })
  valeur: number;

  @ApiProperty({ type: ToleranceResponseDto })
  tolerance: ToleranceResponseDto;

  @ApiProperty({
    oneOf: [
      { type: 'string', enum: ['references'] },
      { $ref: getSchemaPath(FormeMemeQueResponseDto) },
    ],
  })
  forme: FormeFormule;
}

class CorrigeFeuillePresentateurResponseDto {
  @ApiProperty({ enum: ['feuille'] })
  type: 'feuille';

  @ApiProperty({ type: [AttenduFeuillePresentateurResponseDto] })
  attendus: AttenduFeuillePresentateurResponseDto[];

  @ApiProperty({ example: 0.8 })
  seuilReussite: number;
}

export class AttenduTableauPresentateurResponseDto {
  @ApiProperty({ example: 1 })
  rang: number;

  @ApiProperty({ example: 'prix' })
  cle: string;

  @ApiProperty({ example: 20.52 })
  valeur: number;
}

class CorrigeTableauPresentateurResponseDto {
  @ApiProperty({ enum: ['tableau'] })
  type: 'tableau';

  @ApiProperty({ type: [AttenduTableauPresentateurResponseDto] })
  attendus: AttenduTableauPresentateurResponseDto[];

  @ApiProperty({ type: ToleranceResponseDto })
  tolerance: ToleranceResponseDto;

  @ApiProperty({ example: 0.75 })
  seuilReussite: number;
}

export class AttenduClassementPresentateurResponseDto {
  @ApiProperty({ example: 'carte-ca-2024-2025' })
  carteId: string;

  @ApiProperty({ example: 'comparable' })
  categorieId: string;

  @ApiProperty({ example: 'Même périmètre, même unité, même durée.' })
  justification: string;
}

class CorrigeClassementPresentateurResponseDto {
  @ApiProperty({ enum: ['classement'] })
  type: 'classement';

  @ApiProperty({ type: [AttenduClassementPresentateurResponseDto] })
  attendus: AttenduClassementPresentateurResponseDto[];

  @ApiProperty({ example: 0.75 })
  seuilReussite: number;
}

export class EnigmePresentateurResponseDto {
  @ApiProperty({ example: 'enigme-1' })
  enigmeId: string;

  @ApiProperty({ example: '142 920' })
  solution: string;

  @ApiProperty({ example: '7' })
  fragment: string;
}

class CorrigeEnigmesPresentateurResponseDto {
  @ApiProperty({ enum: ['enigmes'] })
  type: 'enigmes';

  @ApiProperty({ type: [EnigmePresentateurResponseDto] })
  enigmes: EnigmePresentateurResponseDto[];

  @ApiProperty({ example: '7-3-1-9' })
  codeFinal: string;
}

export class StrategiePresentateurResponseDto {
  @ApiProperty({ example: 'somme-des-taux' })
  id: string;

  @ApiProperty({ example: 'Additionner les taux annoncés' })
  libelle: string;

  @ApiProperty({ example: true })
  fausse: boolean;
}

class CorrigeDefiPresentateurResponseDto {
  @ApiProperty({ enum: ['defi'] })
  type: 'defi';

  @ApiProperty({ type: [StrategiePresentateurResponseDto] })
  strategies: StrategiePresentateurResponseDto[];
}

class CorrigeRevelationPresentateurResponseDto {
  @ApiProperty({ enum: ['revelation'] })
  type: 'revelation';

  @ApiProperty({ example: 'Une hausse puis une baisse de 20 %' })
  titre: string;

  @ApiProperty({ type: [String] })
  lignes: string[];
}

export class QuestionDerouleResponseDto {
  @ApiProperty({ example: 'b2-01-a3-vote-hausse-baisse' })
  id: string;

  @ApiProperty({ example: 'Le prix monte de 20 %, puis baisse de 20 %.' })
  enonce: string;

  @ApiProperty({
    type: [OptionPubliqueResponseDto],
    nullable: true,
    description: 'Options d un vote, null pour une question numerique',
  })
  options: OptionPubliqueResponseDto[] | null;
}

@ApiExtraModels(
  CorrigeFeuillePresentateurResponseDto,
  CorrigeTableauPresentateurResponseDto,
  CorrigeClassementPresentateurResponseDto,
  CorrigeEnigmesPresentateurResponseDto,
  CorrigeDefiPresentateurResponseDto,
  CorrigeRevelationPresentateurResponseDto,
)
export class EcranDerouleResponseDto
  extends EcranPublicResponseDto
  implements EcranDeroule
{
  @ApiProperty({ description: 'Notes du formateur' })
  notes: string;

  @ApiProperty({ enum: DIFFUSIONS })
  diffusion: Diffusion;

  @ApiProperty({ nullable: true, type: Number, example: 0.7 })
  seuil: number | null;

  @ApiProperty({ type: [CorrigePresentateurResponseDto] })
  corriges: CorrigePresentateurResponseDto[];

  @ApiProperty({ type: [QuestionDerouleResponseDto] })
  questions: QuestionDerouleResponseDto[];

  @ApiProperty({
    description:
      'Corrige de production, de defi ou de revelation, jamais servi au sujet ni au catalogue',
    nullable: true,
    oneOf: [
      { $ref: getSchemaPath(CorrigeFeuillePresentateurResponseDto) },
      { $ref: getSchemaPath(CorrigeTableauPresentateurResponseDto) },
      { $ref: getSchemaPath(CorrigeClassementPresentateurResponseDto) },
      { $ref: getSchemaPath(CorrigeEnigmesPresentateurResponseDto) },
      { $ref: getSchemaPath(CorrigeDefiPresentateurResponseDto) },
      { $ref: getSchemaPath(CorrigeRevelationPresentateurResponseDto) },
    ],
  })
  corrigeEcran: CorrigeEcranPresentateur | null;

  @ApiPropertyOptional({ type: GuideFormateurResponseDto })
  guide?: GuideFormateurResponseDto;
}

export class DerouleResponseDto
  extends OmitType(SujetResponseDto, ['ecrans'] as const)
  implements DerouleCours
{
  @ApiProperty({ type: [EcranDerouleResponseDto] })
  ecrans: EcranDerouleResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { 'base-arrivee': 'B2-01-A3-04-FIL-TECHNIQUE' },
  })
  remediations: Record<string, string>;
}
