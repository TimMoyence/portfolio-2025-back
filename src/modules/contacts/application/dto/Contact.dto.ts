import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
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
}
