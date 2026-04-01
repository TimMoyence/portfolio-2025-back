import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/** DTO HTTP pour definir un mot de passe sur un compte Google-only.
 *  userId est injecte par le controller depuis le JWT — jamais expose dans le body. */
export class SetPasswordDto {
  @ApiProperty({ example: 'NewPassword456!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
  })
  newPassword: string;
}
