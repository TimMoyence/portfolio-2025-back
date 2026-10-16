import { ApiProperty } from '@nestjs/swagger';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import type { LoginCommand } from '../../application/dto/Login.command';
import { MotDePasseSaisi } from './regles-de-saisie';

export class LoginDto implements LoginCommand {
  @ApiProperty({ example: 'john@example.com' })
  @AdresseEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @MotDePasseSaisi()
  password: string;
}
