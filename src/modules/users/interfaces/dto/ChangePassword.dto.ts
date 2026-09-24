import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { ChangePasswordCommand } from '../../application/dto/ChangePassword.command';
import { MotDePasseRobuste } from './regles-de-saisie';

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
  @MotDePasseRobuste()
  newPassword: string;

  @ApiPropertyOptional({ example: 'user-admin' })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
