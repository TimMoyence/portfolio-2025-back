import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { ArticleStatus } from '../../application/articles.repository';

@Entity({ name: 'articles' })
@Index('uq_articles_locale_slug', ['locale', 'slug'], { unique: true })
@Index('idx_articles_published_at', ['publishedAt'])
@Unique('UQ_articles_id', ['articleId'])
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  articleId: string;

  @Column({ type: 'varchar', length: 120 })
  slug: string;

  @Column({ type: 'varchar', length: 2 })
  locale: 'fr' | 'en';

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: ArticleStatus;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'varchar', length: 280 })
  excerpt: string;

  @Column({ type: 'text' })
  contentMarkdown: string;

  @Column({ type: 'integer', nullable: true })
  readingTimeMinutes: number | null;

  @Column({ type: 'jsonb' })
  tags: string[];

  @Column({ type: 'jsonb' })
  sections: unknown[];

  @Column({ type: 'jsonb' })
  sources: unknown[];

  @Column({ type: 'jsonb' })
  provenance: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  seo: Record<string, unknown>;

  @Column({ type: 'timestamp with time zone' })
  publishedAt: Date;

  @Column({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 64 })
  contentSha256: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
