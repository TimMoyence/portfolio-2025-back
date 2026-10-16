import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { PublishableStatus } from '../../../../common/domain/types/publishable-status';
import {
  RangDAffichage,
  SlugDeContenu,
  StatutDePublication,
} from '../../../../common/interfaces/dto/champs-de-contenu.decorator';
import {
  AuPlusCaracteres,
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';

export class ServiceRequestDto {
  @SlugDeContenu('technical-seo')
  slug: string;

  @ApiProperty({ example: 'Technical SEO' })
  @TexteSaisi(2, 120)
  name: string;

  @ApiProperty({ example: '/icons/seo.svg', required: false })
  @IsOptional()
  @Rogne()
  @IsString()
  @AuPlusCaracteres(500)
  icon?: string;

  @StatutDePublication()
  status?: PublishableStatus;

  @RangDAffichage()
  order?: number;
}
