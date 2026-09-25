import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { CreateUserCommand } from '../../application/dto/CreateUser.command';
import {
  MotDePasseRobuste,
  RolesValides,
  TelephoneOptionnel,
} from './regles-de-saisie';

export class CreateUserDto implements CreateUserCommand {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @MotDePasseRobuste()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @TelephoneOptionnel('+11234567890')
  phone?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['teacher'],
    default: [],
    type: [String],
  })
  @RolesValides()
  roles?: string[];

  @ApiPropertyOptional({ example: 'system', nullable: true })
  @IsOptional()
  @IsString()
  updatedOrCreatedBy?: string | null;
}
