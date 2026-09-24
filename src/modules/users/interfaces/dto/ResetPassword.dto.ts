import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { ResetPasswordCommand } from '../../application/dto/ResetPassword.command';
import { MotDePasseRobuste } from './regles-de-saisie';

export class ResetPasswordDto implements ResetPasswordCommand {
  @ApiProperty({
    example: '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewPassword456!' })
  @MotDePasseRobuste()
  newPassword: string;
}
