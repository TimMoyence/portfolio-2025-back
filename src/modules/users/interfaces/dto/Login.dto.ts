import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { LoginCommand } from '../../application/dto/Login.command';

/** DTO HTTP pour l'authentification (validation + Swagger). */
export class LoginDto implements LoginCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est requis.' })
  @MaxLength(256, { message: 'Le mot de passe est trop long.' })
  password: string;
}
