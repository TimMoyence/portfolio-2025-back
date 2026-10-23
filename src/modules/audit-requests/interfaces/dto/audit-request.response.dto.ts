import { ApiProperty } from '@nestjs/swagger';
import {
  type AuditProcessingStatus,
  STATUTS_D_AUDIT,
} from '../../domain/AuditProcessing';

export class AuditRequestResponseDto {
  @ApiProperty({ example: 'Audit request created successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  httpCode: number;

  @ApiProperty({ example: 'f8dd820d-fc38-4f6a-83be-a833aa6be16f' })
  auditId: string;

  @ApiProperty({
    example: 'PENDING',
    enumName: 'StatutDAudit',
    enum: STATUTS_D_AUDIT,
  })
  status: AuditProcessingStatus;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    example: 24,
    description:
      'Heures de validite du lien de confirmation envoye par courriel ; null quand aucune confirmation n est attendue.',
  })
  heuresDeValiditeDeLaConfirmation: number | null;
}
