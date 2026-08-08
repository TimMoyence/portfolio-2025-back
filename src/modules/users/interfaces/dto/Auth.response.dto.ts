import { ApiProperty } from '@nestjs/swagger';
import type { AuthResult } from '../../application/AuthenticateUser.useCase';
import { UserResponseDto } from './User.response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  static fromAuthResult(result: AuthResult): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = result.accessToken;
    dto.expiresIn = result.expiresIn;
    dto.user = UserResponseDto.fromDomain(result.user);
    return dto;
  }
}
