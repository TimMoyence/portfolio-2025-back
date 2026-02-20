import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 124 })
  total: number;

  @ApiProperty({ example: 7 })
  totalPages: number;
}
