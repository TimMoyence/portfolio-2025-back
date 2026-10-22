import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import type { ResetPasswordCommand } from '../../application/dto/ResetPassword.command';
import { DOCUMENTATION_D_UN_JETON_DE_LIEN } from '../../../../common/interfaces/security/jeton-de-lien.pipe';
import { MotDePasseRobuste } from './regles-de-saisie';

export class ResetPasswordDto implements ResetPasswordCommand {
  @ApiProperty(DOCUMENTATION_D_UN_JETON_DE_LIEN)
  @Allow()
  token: unknown;

  @ApiProperty({ example: 'NewPassword456!' })
  @MotDePasseRobuste()
  newPassword: string;
}
