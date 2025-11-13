import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './User.response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 3600 })
  expiresIn: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;
}
