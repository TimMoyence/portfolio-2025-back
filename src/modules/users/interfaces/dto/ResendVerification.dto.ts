import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Adresse email du compte a verifier',
    example: 'john@example.com',
    minLength: 1,
  })
  @AdresseEmail()
  @IsNotEmpty()
  email: string;
}
