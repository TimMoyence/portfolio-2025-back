import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/** DTO de requete pour le renvoi d'un email de verification. */
export class ResendVerificationDto {
  @ApiProperty({
    description: 'Adresse email du compte a verifier',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
