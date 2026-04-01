import { ApiProperty } from '@nestjs/swagger';

/** DTO de reponse HTTP pour les actions auth retournant un message. */
export class AuthMessageResponseDto {
  @ApiProperty({
    example:
      'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
  })
  message: string;
}
