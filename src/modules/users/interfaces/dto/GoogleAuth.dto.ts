import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token reçu du client GIS',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
