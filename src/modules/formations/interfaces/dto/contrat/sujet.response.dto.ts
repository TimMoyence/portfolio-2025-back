import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { CHAMPS_EXTRAITS_DU_CAS } from '../../../domain/contrats/cours';
import type { PieceJointeServie } from '../../../domain/cours/Cours';
import type {
  CoursPublic,
  CoursPublicCatalogue,
  EcranPublic,
} from '../../../domain/contrats/tirage';
import {
  EcranPublicResponseDto as EcranPublicServiResponseDto,
  ecransDuContrat,
  SujetResponseDto as SujetServiResponseDto,
} from '../sujet.response.dto';
import { CorrectionServieResponseDto } from './corrige-ecran.response.dto';

class ExtraitDuRenvoiResponseDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Rangs des lignes reprises de l ecran renvoye',
    example: [0, 2],
  })
  lignes?: readonly number[];

  @ApiPropertyOptional({
    enum: CHAMPS_EXTRAITS_DU_CAS,
    enumName: 'ChampExtraitDuCas',
    isArray: true,
    description: 'Champs du cas repris de l ecran renvoye',
  })
  champs?: readonly (typeof CHAMPS_EXTRAITS_DU_CAS)[number][];
}

class CadrageDuRenvoiResponseDto {
  @ApiPropertyOptional({ type: ExtraitDuRenvoiResponseDto })
  extrait?: ExtraitDuRenvoiResponseDto;
}

class PieceJointePubliqueResponseDto {
  @ApiProperty({ example: 'Export des ventes Norvane (classeur Excel)' })
  libelle: string;

  @ApiProperty({
    description: 'Chemin public du fichier',
    example: '/assets/cours/b3-01/B3-01_export_ventes.d4f2ceab.xlsx',
  })
  fichier: string;
}

class PieceJointeReserveeResponseDto {
  @ApiProperty({ example: 'Classeur de la séance' })
  libelle: string;

  @ApiProperty({
    enum: [true],
    description:
      'Piece reservee a la seance, telechargee par la route liee au jeton',
  })
  reservee: true;
}

@ApiExtraModels(PieceJointePubliqueResponseDto, PieceJointeReserveeResponseDto)
export class EcranPublicResponseDto
  extends EcranPublicServiResponseDto
  implements EcranPublic
{
  @ApiProperty({
    description: 'Titre de l ecran, obligatoire a partir de la version 3',
    nullable: true,
    type: String,
    example: 'Le tableau de bord par canal',
  })
  titre: string | null;

  @ApiPropertyOptional({
    description: 'Ecran dont celui-ci reprend le contenu',
    example: 'B3-01-A1-02-COURRIEL',
  })
  renvoi?: string;

  @ApiPropertyOptional({ type: CadrageDuRenvoiResponseDto })
  cadrageDuRenvoi?: CadrageDuRenvoiResponseDto;

  @ApiPropertyOptional({
    oneOf: [
      { $ref: getSchemaPath(PieceJointePubliqueResponseDto) },
      { $ref: getSchemaPath(PieceJointeReserveeResponseDto) },
    ],
  })
  pieceJointe?: PieceJointeServie;

  @ApiPropertyOptional({
    description: 'Ecran dont celui-ci porte la correction',
    example: 'B3-01-A2-03-ATELIER',
  })
  ecranCorrige?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Ecrans qui corrigent celui-ci',
  })
  resoluPar?: readonly string[];

  @ApiPropertyOptional({
    type: CorrectionServieResponseDto,
    description: 'Correction servie au poste une fois l ecran revele',
  })
  correction?: CorrectionServieResponseDto;
}

@ApiExtraModels(EcranPublicResponseDto)
export class SujetResponseDto
  extends SujetServiResponseDto
  implements CoursPublic
{
  @ApiProperty(ecransDuContrat(EcranPublicResponseDto))
  ecrans: readonly EcranPublicResponseDto[];
}

export class CoursPublicCatalogueResponseDto
  extends SujetResponseDto
  implements CoursPublicCatalogue
{
  @ApiProperty({ description: 'Version publiee du cours', example: 3 })
  version: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date de la bascule de publication',
  })
  publieLe: string;
}
