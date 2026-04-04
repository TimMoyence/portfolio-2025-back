import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './User.response.dto';

/** DTO de reponse HTTP pour l'authentification. */
export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({
    description:
      'Refresh token opaque pour obtenir un nouveau couple de tokens',
    example: 'a1b2c3d4e5f6...',
  })
  refreshToken: string;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;
}
