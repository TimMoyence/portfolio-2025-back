import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import type { CorrigeEcranPresentateur } from '../../../domain/contrats/deroule';
import type { FormeFormule } from '../../../domain/cours/Corrige';
import { TableauEvalueResponseDto } from './tableau-evalue.response.dto';

class ToleranceResponseDto {
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
class AttenduFeuillePresentateurResponseDto {
  @ApiProperty({ example: 'E2' })
  reference: string;

  @ApiProperty({ example: '=C2/$C$5' })
  formuleReference: string;

  @ApiProperty({ example: 0.345217 })
  valeur: number;

  @ApiProperty({
    description:
      'Valeur attendue ecrite a la francaise : taux a quatre decimales, montant a deux, milliers separes par une espace fine insecable',
    example: '0,3452',
  })
  affichage: string;

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

class AttenduTableauPresentateurResponseDto {
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

  @ApiProperty({
    type: TableauEvalueResponseDto,
    description:
      'Tableau rempli des valeurs attendues, colonnes deduites, totaux, synthese et solde calcules',
  })
  tableauCorrige: TableauEvalueResponseDto;

  @ApiProperty({ type: ToleranceResponseDto })
  tolerance: ToleranceResponseDto;

  @ApiProperty({ example: 0.75 })
  seuilReussite: number;
}

class AttenduClassementPresentateurResponseDto {
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

class EnigmePresentateurResponseDto {
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

class StrategiePresentateurResponseDto {
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

class CorrigeReflexionPresentateurResponseDto {
  @ApiProperty({ enum: ['reflexion'] })
  type: 'reflexion';

  @ApiProperty({ example: 'Un montant et un taux, sur deux dates.' })
  attendu: string;

  @ApiProperty({ example: 'Nommez toujours le dénominateur.' })
  suite: string;
}

export class ReflexionPresentateurResponseDto {
  @ApiProperty({ example: 'Un montant et un taux, sur deux dates.' })
  attendu: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Nommez toujours le dénominateur.',
  })
  suite: string | null;
}

export const CORRIGES_D_ECRAN = [
  CorrigeFeuillePresentateurResponseDto,
  CorrigeTableauPresentateurResponseDto,
  CorrigeClassementPresentateurResponseDto,
  CorrigeEnigmesPresentateurResponseDto,
  CorrigeDefiPresentateurResponseDto,
  CorrigeRevelationPresentateurResponseDto,
  CorrigeReflexionPresentateurResponseDto,
];

export const UN_CORRIGE_D_ECRAN = CORRIGES_D_ECRAN.map((corrige) => ({
  $ref: getSchemaPath(corrige),
}));

export class ExplicationDeCorrectionResponseDto {
  @ApiProperty({ example: 'identifiant' })
  reference: string;

  @ApiProperty({
    example: 'Cinq identifiants : on les compte, on ne les additionne jamais.',
  })
  texte: string;
}

class QuestionCorrigeeResponseDto {
  @ApiProperty({ example: 'b2-01-a3-vote-hausse-baisse' })
  questionId: string;

  @ApiProperty({ example: 'plus bas qu’au départ' })
  bonneReponse: string;

  @ApiProperty({ nullable: true, type: String, example: 'b' })
  optionId: string | null;
}

@ApiExtraModels(...CORRIGES_D_ECRAN)
export class CorrectionServieResponseDto {
  @ApiProperty({ example: 'B2-01-A3-02-VOTE' })
  ecranId: string;

  @ApiProperty({ type: [QuestionCorrigeeResponseDto] })
  questions: QuestionCorrigeeResponseDto[];

  @ApiProperty({ nullable: true, oneOf: UN_CORRIGE_D_ECRAN })
  corrige: CorrigeEcranPresentateur | null;

  @ApiProperty({ type: ReflexionPresentateurResponseDto, nullable: true })
  reflexion: ReflexionPresentateurResponseDto | null;

  @ApiPropertyOptional({ type: [ExplicationDeCorrectionResponseDto] })
  explications?: ExplicationDeCorrectionResponseDto[];
}
