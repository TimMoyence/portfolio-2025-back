import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  EntierBorne,
  UrlAbsolue,
} from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { SlugDeContenu } from '../../../../common/interfaces/dto/champs-de-contenu.decorator';

export class RedirectRequestDto {
  @SlugDeContenu('promo-offer')
  slug: string;

  @ApiProperty({ example: 'https://example.com/promo' })
  @UrlAbsolue()
  targetUrl: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @EntierBorne(0, 1000000000)
  clicks?: number;
}
