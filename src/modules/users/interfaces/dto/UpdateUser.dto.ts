import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import type { UpdateUserCommand } from '../../application/dto/UpdateUser.command';
import {
  MotDePasseRobuste,
  RolesValides,
  TelephoneOptionnel,
} from './regles-de-saisie';

export class UpdateUserDto implements UpdateUserCommand {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword456!' })
  @IsOptional()
  @MotDePasseRobuste()
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @TelephoneOptionnel('+11234567890')
  phone?: string | null;

  @ApiPropertyOptional({
    example: ['admin', 'teacher'],
    type: [String],
    description: 'Liste des roles. Reserve aux administrateurs.',
  })
  @RolesValides()
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
