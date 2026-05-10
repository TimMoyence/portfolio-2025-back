import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Warning non bloquant remonte par le serveur — utilise notamment lors du
 * register avec `inviteToken` pour signaler qu'une auto-acceptation
 * d'invitation a echoue (token expire, mismatch d'email, etc.) sans
 * bloquer l'inscription.
 */
export class AuthWarningDto {
  @ApiProperty({ example: 'INVITATION_EXPIRED' })
  code: string;

  @ApiProperty({ example: 'Cette invitation a expire.' })
  message: string;
}

/** DTO de reponse HTTP pour les actions auth retournant un message. */
export class AuthMessageResponseDto {
  @ApiProperty({
    example:
      'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
  })
  message: string;

  /**
   * Warning optionnel — pour le register, presence si `inviteToken` etait
   * fourni mais que l'auto-acceptation a echoue avec une erreur metier
   * connue. L'inscription reste valide ; le frontend peut afficher un
   * bandeau et inviter l'utilisateur a re-tenter manuellement.
   */
  @ApiPropertyOptional({ type: AuthWarningDto })
  inviteWarning?: { code: string; message: string };
}
