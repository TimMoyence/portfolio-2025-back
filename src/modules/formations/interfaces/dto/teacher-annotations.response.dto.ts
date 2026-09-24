import { ApiProperty } from '@nestjs/swagger';

export class TeacherAnnotationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  sessionId: string;

  @ApiProperty({ format: 'uuid', description: 'Formateur propriétaire' })
  teacherId: string;

  @ApiProperty({ example: 'B2-01-S11-REFLECTION' })
  screenId: string;

  @ApiProperty({ example: 'Faire expliciter la base de comparaison.' })
  note: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class TeacherAnnotationsResponseDto {
  @ApiProperty({
    type: [TeacherAnnotationResponseDto],
    description: 'Annotations triées par écran',
  })
  annotations: TeacherAnnotationResponseDto[];
}
