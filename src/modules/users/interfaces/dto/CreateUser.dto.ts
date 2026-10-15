import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdresseEmail } from '../../../../common/interfaces/dto/adresse-email.decorator';
import type { CreateUserCommand } from '../../application/dto/CreateUser.command';
import {
  MotDePasseRobuste,
  NomDeCompte,
  RolesValides,
  TelephoneOptionnel,
} from './regles-de-saisie';

export class CreateUserDto implements CreateUserCommand {
  @ApiProperty({ example: 'john@example.com' })
  @AdresseEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @MotDePasseRobuste()
  @IsNotEmpty()
  password: string;

  @NomDeCompte('Le prenom', 'John')
  firstName: string;

  @NomDeCompte('Le nom', 'Doe')
  lastName: string;

  @TelephoneOptionnel('+11234567890')
  phone?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['teacher'],
    type: [String],
    description: 'Liste des roles. Reserve aux administrateurs.',
  })
  @RolesValides()
  roles?: string[];

  @ApiPropertyOptional({ example: 'system', nullable: true })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
