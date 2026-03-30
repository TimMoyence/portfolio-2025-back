import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import type { LoginCommand } from '../../application/dto/Login.command';

/** DTO HTTP pour l'authentification (validation + Swagger). */
export class LoginDto implements LoginCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
  })
  password: string;
}
