import { ApiProperty } from '@nestjs/swagger';

export class OpenSessionResponseDto {
  @ApiProperty({ example: '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90' })
  sessionId: string;

  @ApiProperty({
    description: 'Code a quatre chiffres dicte aux etudiants',
    example: '4271',
  })
  code: string;
}
