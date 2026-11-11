import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
  LOCALES_SUPPORTEES,
  type SupportedLocale,
} from '../../../../common/domain/value-objects/LocaleCode';
import {
  MOTIF_LIEN_HTTP,
  MOTIF_LIEN_HTTPS,
  type SectionDuRecit,
  LANGUES_TRADUITES,
  UNITES_DU_GRAPHIQUE,
} from '../../domain/contrat/article-contract';

export class SourceDuRecitDto {
  @ApiProperty({ example: 'TechCrunch' })
  nom: string;

  @ApiProperty({ format: 'uri', pattern: MOTIF_LIEN_HTTP })
  url: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publie_le: string | null;
}

export class ImageDuRecitDto {
  @ApiProperty({ format: 'uri', pattern: MOTIF_LIEN_HTTPS })
  url: string;

  @ApiProperty({ example: 'TechCrunch' })
  credit: string;
}

export class FeuilletonDuRecitDto {
  @ApiProperty({ format: 'date', example: '2026-11-08' })
  date: string;

  @ApiProperty()
  rappel: string;
}

export class BarreDuRecitDto {
  @ApiProperty()
  libelle: string;

  @ApiProperty()
  valeur: number;

  @ApiProperty({ example: '49,1 %' })
  affichage: string;

  @ApiProperty({ type: 'integer', minimum: 2, maximum: 100, example: 60 })
  largeur: number;
}

export class GraphiqueDuRecitDto {
  @ApiProperty()
  titre: string;

  @ApiProperty({ enum: [...UNITES_DU_GRAPHIQUE], enumName: 'UniteDuGraphique' })
  unite: (typeof UNITES_DU_GRAPHIQUE)[number];

  @ApiProperty({ type: [BarreDuRecitDto] })
  barres: BarreDuRecitDto[];
}

export class EditoDto {
  @ApiProperty({ enum: ['edito'] })
  kind: 'edito';

  @ApiProperty()
  texte: string;

  @ApiProperty({ example: 'Tim' })
  signature: string;
}

abstract class RecitIllustreDto {
  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;

  @ApiProperty({ type: ImageDuRecitDto, nullable: true })
  image: ImageDuRecitDto | null;

  @ApiProperty({ type: FeuilletonDuRecitDto, nullable: true })
  feuilleton: FeuilletonDuRecitDto | null;
}

export class SujetDuJourDto extends RecitIllustreDto {
  @ApiProperty({ enum: ['sujet'] })
  kind: 'sujet';

  @ApiProperty()
  titre: string;

  @ApiProperty()
  accroche: string;

  @ApiProperty()
  pourquoi: string;

  @ApiProperty()
  contexte: string;

  @ApiProperty()
  faits: string;

  @ApiProperty()
  et_maintenant: string;

  @ApiProperty()
  bref: string;

  @ApiProperty({ type: GraphiqueDuRecitDto, nullable: true })
  graphique: GraphiqueDuRecitDto | null;
}

export class HistoireDuShotDto extends RecitIllustreDto {
  @ApiProperty({ example: 'Tout le monde peut souffler :' })
  accroche: string;

  @ApiProperty()
  texte: string;

  @ApiProperty({ type: String, nullable: true, example: 'outils_ia' })
  rubrique: string | null;
}

export class ShotDto {
  @ApiProperty({ enum: ['shot'] })
  kind: 'shot';

  @ApiProperty({ type: [HistoireDuShotDto] })
  histoires: HistoireDuShotDto[];
}

export class DecodeurDto {
  @ApiProperty({ enum: ['decodeur'] })
  kind: 'decodeur';

  @ApiProperty()
  terme: string;

  @ApiProperty()
  explication: string;
}

export class ATesterDto {
  @ApiProperty({ enum: ['a_tester'] })
  kind: 'a_tester';

  @ApiProperty()
  nom: string;

  @ApiProperty()
  texte: string;

  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;
}

export class SortieDto {
  @ApiProperty()
  produit: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  changement: string;

  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;
}

export class SortiesDto {
  @ApiProperty({ enum: ['sorties'] })
  kind: 'sorties';

  @ApiProperty({ type: [SortieDto] })
  lignes: SortieDto[];
}

export class ChiffreDto {
  @ApiProperty({ enum: ['chiffre'] })
  kind: 'chiffre';

  @ApiProperty({ example: '40 milliards de dollars' })
  valeur: string;

  @ApiProperty()
  texte: string;

  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;
}

export class CitationDto {
  @ApiProperty({ enum: ['citation'] })
  kind: 'citation';

  @ApiProperty()
  texte: string;

  @ApiProperty()
  auteur: string;

  @ApiProperty({ enum: [...LANGUES_TRADUITES, null], nullable: true })
  traduite_de: (typeof LANGUES_TRADUITES)[number] | null;

  @ApiProperty()
  contexte: string;

  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;
}

export class BreveDto {
  @ApiProperty()
  texte: string;

  @ApiProperty({ type: SourceDuRecitDto })
  source: SourceDuRecitDto;
}

export class APartCaDto {
  @ApiProperty({ enum: ['a_part_ca'] })
  kind: 'a_part_ca';

  @ApiProperty({ type: [BreveDto] })
  breves: BreveDto[];
}

const SECTIONS_DU_RECIT = [
  EditoDto,
  SujetDuJourDto,
  ShotDto,
  DecodeurDto,
  ATesterDto,
  SortiesDto,
  ChiffreDto,
  CitationDto,
  APartCaDto,
];

export class ArticleProvenanceResponseDto {
  @ApiProperty()
  run_id: string;

  @ApiProperty({ example: '2026-11-11' })
  edition_date: string;

  @ApiProperty({ pattern: '^[a-f0-9]{64}$' })
  content_sha256: string;
}

export class ArticleSeoResponseDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ example: '/articles/morning-brief-2026-11-11' })
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

@ApiExtraModels(...SECTIONS_DU_RECIT)
export class PublishedArticleResponseDto {
  @ApiProperty({ example: 'morning-brief-2026-11-11-fr' })
  article_id: string;

  @ApiProperty({ example: 'morning-brief-2026-11-11' })
  slug: string;

  @ApiProperty({
    enum: [...LOCALES_SUPPORTEES],
    enumName: 'Locale',
    example: 'fr',
  })
  locale: SupportedLocale;

  @ApiProperty({ example: 'L’IA à dix centimes' })
  title: string;

  @ApiProperty()
  excerpt: string;

  @ApiProperty()
  content_markdown: string;

  @ApiProperty({ type: Number, nullable: true, example: 6 })
  reading_time_minutes: number | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: SECTIONS_DU_RECIT.map((section) => ({
        $ref: getSchemaPath(section),
      })),
      discriminator: { propertyName: 'kind' },
    },
  })
  sections: SectionDuRecit[];

  @ApiProperty({ type: [SourceDuRecitDto] })
  sources: SourceDuRecitDto[];

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
