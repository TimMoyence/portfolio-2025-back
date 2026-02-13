import { ApiProperty } from '@nestjs/swagger';

export class AuditRequestResponseDto {
  @ApiProperty({ example: 'Audit request created successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  httpCode: number;
}
