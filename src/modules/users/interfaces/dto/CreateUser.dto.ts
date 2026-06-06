import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { CreateUserCommand } from '../../application/dto/CreateUser.command';
import { VALID_ROLES } from '../../domain/roles';

/** DTO HTTP pour la creation d'un utilisateur (validation + Swagger). */
export class CreateUserDto implements CreateUserCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caracteres.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    example: '+11234567890',
    nullable: true,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['budget'],
    default: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_ROLES as unknown as string[], {
    each: true,
    message: 'Chaque role doit etre un role valide',
  })
  roles?: string[];

  @ApiPropertyOptional({ example: 'system', nullable: true })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
