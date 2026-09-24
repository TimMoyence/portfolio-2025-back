import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { MotDePasseRobuste } from './regles-de-saisie';

export class SetPasswordDto {
  @ApiProperty({ example: 'NewPassword456!' })
  @MotDePasseRobuste()
  @IsNotEmpty()
  newPassword: string;
}
