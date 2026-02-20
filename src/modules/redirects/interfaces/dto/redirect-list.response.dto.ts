import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '../../../../common/interfaces/dto/pagination-meta.response.dto';
import { RedirectResponseDto } from './redirect.response.dto';

export class RedirectListResponseDto {
  @ApiProperty({ type: RedirectResponseDto, isArray: true })
  items: RedirectResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
