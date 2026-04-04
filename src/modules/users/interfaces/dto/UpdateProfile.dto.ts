import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { UpdateProfileCommand } from '../../application/dto/UpdateProfile.command';

/** DTO HTTP pour la mise a jour du profil utilisateur (self-update, validation + Swagger). */
export class UpdateProfileDto implements UpdateProfileCommand {
  @ApiPropertyOptional({ example: 'Jean', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le prenom doit contenir au moins 2 caracteres.' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Dupont', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caracteres.' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+33612345678',
    nullable: true,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
