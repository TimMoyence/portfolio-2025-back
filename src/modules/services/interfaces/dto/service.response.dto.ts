import { ApiProperty } from '@nestjs/swagger';
import { Services } from '../../domain/Services';

export class ServiceResponseDto {
  @ApiProperty({ example: 'e0c9dcbf-8de6-4e2c-a2fb-fd899f26976e' })
  id: string;

  @ApiProperty({ example: 'technical-seo' })
  slug: string;

  @ApiProperty({ example: 'Technical SEO' })
  name: string;

  @ApiProperty({ example: '/icons/seo.svg', required: false })
  icon?: string;

  @ApiProperty({
    example: 'PUBLISHED',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiProperty({ example: 0 })
  order: number;

  static fromDomain(domain: Services): ServiceResponseDto {
    const dto = new ServiceResponseDto();
    dto.id = domain.id ?? '';
    dto.slug = domain.slug;
    dto.name = domain.name;
    dto.icon = domain.icon;
    dto.status = domain.status;
    dto.order = domain.order;
    return dto;
  }
}
