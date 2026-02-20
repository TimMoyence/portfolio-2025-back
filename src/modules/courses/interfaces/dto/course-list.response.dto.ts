import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from '../../../../common/interfaces/dto/pagination-meta.response.dto';
import { CourseResponseDto } from './course.response.dto';

export class CourseListResponseDto {
  @ApiProperty({ type: CourseResponseDto, isArray: true })
  items: CourseResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
