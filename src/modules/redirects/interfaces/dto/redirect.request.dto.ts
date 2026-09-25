import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUrl, Max, Min } from 'class-validator';
import { SlugDeContenu } from '../../../../common/interfaces/dto/champs-de-contenu.decorator';

export class RedirectRequestDto {
  @SlugDeContenu('promo-offer')
  slug: string;

  @ApiProperty({ example: 'https://example.com/promo' })
  @IsUrl({ require_protocol: true })
  targetUrl: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: 0, required: false, minimum: 0, maximum: 1000000000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  clicks?: number;
}
