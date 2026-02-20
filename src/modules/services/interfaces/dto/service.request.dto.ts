import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const SERVICE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
type ServiceStatusValue = (typeof SERVICE_STATUSES)[number];

export class ServiceRequestDto {
  @ApiProperty({ example: 'technical-seo' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ example: 'Technical SEO' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: '/icons/seo.svg', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @ApiProperty({ example: 'PUBLISHED', required: false, enum: SERVICE_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(SERVICE_STATUSES)
  status?: ServiceStatusValue;

  @ApiProperty({ example: 0, required: false, minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  order?: number;
}
