import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '../../../../common/interfaces/dto/pagination-meta.response.dto';
import { ServiceResponseDto } from './service.response.dto';

export class ServiceListResponseDto {
  @ApiProperty({ type: ServiceResponseDto, isArray: true })
  items: ServiceResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
