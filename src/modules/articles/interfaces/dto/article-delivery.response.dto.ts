import { ApiProperty, PickType } from '@nestjs/swagger';
import type { ArticleIngestResult } from '../../application/articles.service';

export class ArticleDeliveryResponseDto {
  @ApiProperty({ example: 'mb-2026-09-23-fr' })
  delivery_id: string;

  @ApiProperty({ enum: ['accepted'] })
  status: 'accepted';

  @ApiProperty({ example: 'morning-brief-2026-09-23-fr' })
  article_id: string;

  @ApiProperty({ example: 1 })
  attempts: number;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  processed_at: string | null;
}

export class ArticleIngestResponseDto
  extends PickType(ArticleDeliveryResponseDto, [
    'delivery_id',
    'status',
    'article_id',
  ] as const)
  implements ArticleIngestResult
{
  @ApiProperty({ description: 'Édition déjà reçue sous cette clé' })
  duplicate: boolean;

  @ApiProperty({ format: 'date-time' })
  received_at: string;
}
