import { ApiProperty } from '@nestjs/swagger';

export class ContactResponseDto {
  @ApiProperty({ example: 'Contact message created successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  httpCode: number;
}
