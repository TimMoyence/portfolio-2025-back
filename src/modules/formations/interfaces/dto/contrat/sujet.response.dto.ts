import { ApiProperty, OmitType } from '@nestjs/swagger';
import type {
  CoursPublic,
  CoursPublicCatalogue,
  EcranPublic,
} from '../../../domain/contrats/tirage';
import {
  EcranPublicResponseDto as EcranPublicServiResponseDto,
  SujetResponseDto as SujetServiResponseDto,
} from '../sujet.response.dto';

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
}

export class SujetResponseDto
  extends OmitType(SujetServiResponseDto, ['ecrans'] as const)
  implements CoursPublic
{
  @ApiProperty({ type: [EcranPublicResponseDto] })
  ecrans: EcranPublicResponseDto[];
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
