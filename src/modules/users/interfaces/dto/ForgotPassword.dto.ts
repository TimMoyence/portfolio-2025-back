import { ApiProperty } from '@nestjs/swagger';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import type { RequestPasswordResetCommand } from '../../application/dto/RequestPasswordReset.command';

export class ForgotPasswordDto implements RequestPasswordResetCommand {
  @ApiProperty({ example: 'john@example.com' })
  @AdresseEmail()
  email: string;
}
