import { ApiProperty } from '@nestjs/swagger';

export class TentativeEnigmeResponseDto {
  @ApiProperty({ example: true })
  correcte: boolean;

  @ApiProperty({
    description: 'Fragment du code, livre seulement a la resolution',
    nullable: true,
    type: String,
    example: '7',
  })
  fragment: string | null;

  @ApiProperty({ minimum: 0, maximum: 10, example: 9 })
  tentativesRestantes: number;
}
