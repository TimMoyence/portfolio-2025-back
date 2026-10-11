import { ApiProperty } from '@nestjs/swagger';
import type { ResetPasswordCommand } from '../../application/dto/ResetPassword.command';
import { JetonDeLien, MotDePasseRobuste } from './regles-de-saisie';

export class ResetPasswordDto implements ResetPasswordCommand {
  @JetonDeLien()
  token: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @MotDePasseRobuste()
  newPassword: string;
}
