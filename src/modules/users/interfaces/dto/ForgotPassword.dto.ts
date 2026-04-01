import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import type { RequestPasswordResetCommand } from '../../application/dto/RequestPasswordReset.command';

/** DTO HTTP pour demander une reinitialisation de mot de passe. */
export class ForgotPasswordDto implements RequestPasswordResetCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
