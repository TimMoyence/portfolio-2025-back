import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO de requete pour le rafraichissement ou la revocation d'un refresh token. */
export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token opaque emis lors de l'authentification",
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
