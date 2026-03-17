import { ApiProperty } from '@nestjs/swagger';
import { Projects } from '../../domain/Projects';

export class ProjectResponseDto {
  @ApiProperty({ example: '5de888ea-7f7f-4700-82a8-d5ce3fb4a4da' })
  id: string;

  @ApiProperty({ example: 'portfolio-site' })
  slug: string;

  @ApiProperty({ example: 'SIDE', enum: ['CLIENT', 'SIDE'] })
  type: 'CLIENT' | 'SIDE';

  @ApiProperty({
    example: 'https://github.com/acme/portfolio',
    required: false,
  })
  repoUrl?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  liveUrl?: string;

  @ApiProperty({ example: '/images/portfolio.webp', required: false })
  coverImage?: string;

  @ApiProperty({
    example: ['/images/portfolio-1.webp', '/images/portfolio-2.webp'],
    type: String,
    isArray: true,
  })
  gallery: string[];

  @ApiProperty({ example: ['nestjs', 'postgres'], type: String, isArray: true })
  stack: string[];

  @ApiProperty({
    example: 'PUBLISHED',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiProperty({ example: 0 })
  order: number;

  static fromDomain(domain: Projects): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id = domain.id ?? '';
    dto.slug = domain.slug;
    dto.type = domain.type;
    dto.repoUrl = domain.repoUrl;
    dto.liveUrl = domain.liveUrl;
    dto.coverImage = domain.coverImage;
    dto.gallery = domain.gallery;
    dto.stack = domain.stack;
    dto.status = domain.status;
    dto.order = domain.order;
    return dto;
  }
}
