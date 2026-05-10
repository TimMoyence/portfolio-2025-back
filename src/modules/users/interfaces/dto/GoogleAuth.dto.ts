import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** DTO pour l'authentification via Google OAuth. */
export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token reçu du client GIS' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  /**
   * Token clair d'une invitation budget magic-link. Optionnel.
   * Si fourni, l'invitation est auto-acceptee apres login/inscription Google.
   * L'echec de l'acceptation n'empeche pas le login.
   */
  @ApiPropertyOptional({
    description:
      "Token d'invitation budget (auto-acceptee apres login Google si fourni)",
  })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
