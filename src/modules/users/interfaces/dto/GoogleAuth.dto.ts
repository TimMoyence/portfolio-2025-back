import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO pour l'authentification via Google OAuth. */
export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token reçu du client GIS' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
