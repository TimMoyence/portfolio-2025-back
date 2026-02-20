import { ApiProperty } from '@nestjs/swagger';
import { Redirects } from '../../domain/Redirects';

export class RedirectResponseDto {
  @ApiProperty({ example: '385c6819-136b-4f66-a2d7-1fd68ff6318e' })
  id: string;

  @ApiProperty({ example: 'promo-offer' })
  slug: string;

  @ApiProperty({ example: 'https://example.com/promo' })
  targetUrl: string;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: 0 })
  clicks: number;

  static fromDomain(domain: Redirects): RedirectResponseDto {
    const dto = new RedirectResponseDto();
    dto.id = domain.id ?? '';
    dto.slug = domain.slug;
    dto.targetUrl = domain.targetUrl;
    dto.enabled = domain.enabled;
    dto.clicks = domain.clicks;
    return dto;
  }
}
