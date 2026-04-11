import { ApiProperty } from '@nestjs/swagger';
import type { AuthResult } from '../../application/AuthenticateUser.useCase';
import { UserResponseDto } from './User.response.dto';

/**
 * DTO de reponse HTTP pour l'authentification.
 * Le refresh token n'est plus inclus dans le body — il est emis
 * dans un cookie HttpOnly securise.
 */
export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  /** Construit un AuthResponseDto a partir d'un resultat d'authentification domaine. */
  static fromAuthResult(result: AuthResult): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = result.accessToken;
    dto.expiresIn = result.expiresIn;
    dto.user = UserResponseDto.fromDomain(result.user);
    return dto;
  }
}
