import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RedirectRequestDto {
  @ApiProperty({ example: 'promo-offer' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
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
