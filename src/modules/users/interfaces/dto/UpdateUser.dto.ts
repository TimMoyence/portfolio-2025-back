import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { UpdateUserCommand } from '../../application/dto/UpdateUser.command';
import { VALID_ROLES } from '../../domain/roles';

/** DTO HTTP pour la mise a jour d'un utilisateur (validation + Swagger). */
export class UpdateUserDto implements UpdateUserCommand {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword456!' })
  @IsOptional()
  @IsString()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
  })
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '+11234567890',
    nullable: true,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({
    example: ['budget', 'weather'],
    type: [String],
    description: 'Liste des roles. Reserve aux administrateurs.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_ROLES as unknown as string[], {
    each: true,
    message: 'Chaque role doit etre un role valide',
  })
  roles?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '1', nullable: true })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
