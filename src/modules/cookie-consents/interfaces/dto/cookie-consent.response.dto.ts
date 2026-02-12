import { ApiProperty } from '@nestjs/swagger';

export class CookieConsentResponseDto {
  @ApiProperty({ example: 'Cookie consent recorded successfully.' })
  message: string;

  @ApiProperty({ example: 201 })
  httpCode: number;
}
