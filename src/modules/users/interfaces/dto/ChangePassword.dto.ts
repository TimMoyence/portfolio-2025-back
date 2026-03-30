import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import type { ChangePasswordCommand } from '../../application/dto/ChangePassword.command';

/** DTO HTTP pour le changement de mot de passe (validation + Swagger). */
export class ChangePasswordDto implements ChangePasswordCommand {
  @ApiPropertyOptional({
    example: 'user-uuid',
    description: 'Ignore dans le body — extrait automatiquement du JWT.',
  })
  @IsOptional()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'CurrentPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
  })
  newPassword: string;

  @ApiPropertyOptional({ example: 'user-admin' })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
