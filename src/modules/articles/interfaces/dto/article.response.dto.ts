import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../../../common/domain/value-objects/LocaleCode';
import {
  HORIZONS_D_UNE_INFO,
  MOTIF_LIEN_HTTP,
  PUBLICS_D_UNE_INFO,
  TYPES_DE_SECTION,
} from '../../domain/article-contract';

export class ArticleSectionItemResponseDto {
  @ApiProperty({ example: 'Mistral AI' })
  entity: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ example: 'Le Monde' })
  source: string;

  @ApiProperty({ format: 'uri', pattern: MOTIF_LIEN_HTTP })
  url: string;

  @ApiPropertyOptional({ format: 'date-time' })
  published_at?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  retrieved_at?: string;

  @ApiPropertyOptional({ example: 'Claude Code laisse fuiter des secrets' })
  title?: string;

  @ApiPropertyOptional({ example: '23 points' })
  figure?: string;

  @ApiPropertyOptional()
  for_business?: string;

  @ApiPropertyOptional()
  under_the_hood?: string;

  @ApiPropertyOptional({
    enum: [...PUBLICS_D_UNE_INFO],
    enumName: 'PublicDUneInfo',
  })
  audience?: (typeof PUBLICS_D_UNE_INFO)[number];

  @ApiPropertyOptional({
    enum: [...HORIZONS_D_UNE_INFO],
    enumName: 'HorizonDUneInfo',
  })
  horizon?: (typeof HORIZONS_D_UNE_INFO)[number];

  @ApiPropertyOptional({ type: Number, minimum: 2, example: 3 })
  episode?: number;

  @ApiPropertyOptional()
  recap?: string;

  @ApiPropertyOptional({ example: 'outils-ia' })
  rubric?: string;
}

export class ArticleSectionResponseDto {
  @ApiProperty({ example: 'essentiel' })
  id: string;

  @ApiProperty({ enum: [...TYPES_DE_SECTION], enumName: 'TypeDeSection' })
  kind: (typeof TYPES_DE_SECTION)[number];

  @ApiProperty()
  title: string;

  @ApiProperty()
  intro: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: [ArticleSectionItemResponseDto] })
  items: ArticleSectionItemResponseDto[];
}

export class ArticleSourceResponseDto {
  @ApiProperty({ example: 'Le Monde' })
  name: string;

  @ApiProperty({ format: 'uri', pattern: MOTIF_LIEN_HTTP })
  url: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  published_at: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  retrieved_at: string | null;
}

export class ArticleProvenanceResponseDto {
  @ApiProperty()
  run_id: string;

  @ApiProperty({ example: '2026-09-23' })
  edition_date: string;

  @ApiProperty({ example: 12 })
  item_count: number;

  @ApiProperty({ example: 8 })
  source_count: number;

  @ApiProperty({ pattern: '^[a-f0-9]{64}$' })
  content_sha256: string;
}

export class ArticleSeoResponseDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ example: '/articles/morning-brief-2026-09-23' })
  canonical_path: string;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiProperty({
    type: String,
    format: 'uri',
    pattern: MOTIF_LIEN_HTTP,
    nullable: true,
  })
  image_url: string | null;

  @ApiProperty({ type: String, nullable: true })
  image_alt: string | null;
}

export class PublishedArticleResponseDto {
  @ApiProperty({ example: 'morning-brief-2026-09-23-fr' })
  article_id: string;

  @ApiProperty({ example: 'morning-brief-2026-09-23' })
  slug: string;

  @ApiProperty({
    enum: [...LOCALES_SUPPORTEES],
    enumName: 'Locale',
    example: 'fr',
  })
  locale: SupportedLocale;

  @ApiProperty({ example: 'Veille IA du 23 septembre' })
  title: string;

  @ApiProperty()
  excerpt: string;

  @ApiProperty()
  content_markdown: string;

  @ApiProperty({ type: Number, nullable: true, example: 6 })
  reading_time_minutes: number | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: [ArticleSectionResponseDto] })
  sections: ArticleSectionResponseDto[];

  @ApiProperty({ type: [ArticleSourceResponseDto] })
  sources: ArticleSourceResponseDto[];

  @ApiProperty({ type: ArticleProvenanceResponseDto })
  provenance: ArticleProvenanceResponseDto;

  @ApiProperty({ type: ArticleSeoResponseDto })
  seo: ArticleSeoResponseDto;

  @ApiProperty({ format: 'date-time' })
  published_at: string;

  @ApiProperty({ format: 'date-time' })
  updated_at: string;
}

export class ArticleListResponseDto {
  @ApiProperty({ type: [PublishedArticleResponseDto] })
  items: PublishedArticleResponseDto[];

  @ApiProperty({ type: String, nullable: true })
  next_cursor: string | null;
}
