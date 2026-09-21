import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignFormationGroupRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b0b1c2d3-e4f5-4678-9012-abcdefabcdef',
    description: 'Groupe de la même séance',
  })
  @IsUUID()
  groupId: string;
}
