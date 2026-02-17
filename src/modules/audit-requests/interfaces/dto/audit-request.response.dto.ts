import { ApiProperty } from '@nestjs/swagger';
import type { AuditProcessingStatus } from '../../domain/AuditProcessing';

export class AuditRequestResponseDto {
  @ApiProperty({ example: 'Audit request created successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  httpCode: number;

  @ApiProperty({ example: 'f8dd820d-fc38-4f6a-83be-a833aa6be16f' })
  auditId: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
  })
  status: AuditProcessingStatus;
}
