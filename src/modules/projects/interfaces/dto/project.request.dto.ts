import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
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

const PROJECT_TYPES = ['CLIENT', 'SIDE'] as const;
const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
type ProjectTypeValue = (typeof PROJECT_TYPES)[number];
type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export class ProjectRequestDto {
  @ApiProperty({ example: 'portfolio-site' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ example: 'SIDE', required: false, enum: PROJECT_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(PROJECT_TYPES)
  type?: ProjectTypeValue;

  @ApiProperty({
    example: 'https://github.com/acme/portfolio',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  repoUrl?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  liveUrl?: string;

  @ApiProperty({ example: '/images/portfolio.webp', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiProperty({
    example: ['/images/portfolio-1.webp', '/images/portfolio-2.webp'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  gallery?: string[];

  @ApiProperty({ example: ['nestjs', 'postgres'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  stack?: string[];

  @ApiProperty({ example: 'PUBLISHED', required: false, enum: PROJECT_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatusValue;

  @ApiProperty({ example: 0, required: false, minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  order?: number;
}
