import { ApiProperty } from '@nestjs/swagger';
import type { ChangePasswordCommand } from '../../application/dto/ChangePassword.command';
import { MotDePasseRobuste, MotDePasseSaisi } from './regles-de-saisie';

export class ChangePasswordDto implements Omit<
  ChangePasswordCommand,
  'userId'
> {
  @ApiProperty({ example: 'CurrentPassword123' })
  @MotDePasseSaisi()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @MotDePasseRobuste()
  newPassword: string;
}
