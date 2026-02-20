import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '../../../../common/interfaces/dto/pagination-meta.response.dto';
import { ProjectResponseDto } from './project.response.dto';

export class ProjectListResponseDto {
  @ApiProperty({ type: ProjectResponseDto, isArray: true })
  items: ProjectResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
