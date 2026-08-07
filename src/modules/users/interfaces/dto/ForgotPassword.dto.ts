import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import type { RequestPasswordResetCommand } from '../../application/dto/RequestPasswordReset.command';

export class ForgotPasswordDto implements RequestPasswordResetCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
