import { ApiProperty } from '@nestjs/swagger';

export class AuditConfirmeResponseDto {
  @ApiProperty({ example: 'f8dd820d-fc38-4f6a-83be-a833aa6be16f' })
  auditId: string;
}
