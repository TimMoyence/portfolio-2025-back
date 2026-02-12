import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Hello, I would like to get in touch.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @ApiProperty({ example: '+11234567890', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({ example: 'Devis Asking' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  subject: string;

  @ApiProperty({ example: 'Manager' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  role: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  terms: boolean;

  @ApiProperty({ example: '2026-02-11', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  termsVersion?: string;

  @ApiProperty({ example: 'fr', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  termsLocale?: string;

  @ApiProperty({ example: 'contact_form_checkbox', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  termsMethod?: string;

  @ApiProperty({ example: '2026-02-11T10:45:00.000Z', required: false })
  @IsOptional()
  @IsDate()
  termsAcceptedAt?: Date;
}
