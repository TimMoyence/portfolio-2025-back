import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import type { UpdateProfileCommand } from '../../application/dto/UpdateProfile.command';
import { TelephoneOptionnel } from './regles-de-saisie';

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

  @TelephoneOptionnel('+33612345678')
  phone?: string | null;
}
