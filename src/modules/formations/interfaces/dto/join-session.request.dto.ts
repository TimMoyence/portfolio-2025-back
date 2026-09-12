import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class JoinSessionRequestDto {
  @ApiPropertyOptional({
    description: 'Champ piège anti-robot, doit rester vide',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({
    description: "Timestamp ms d'ouverture du formulaire",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  formStartedAt?: number;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID('4')
  studentKey: string;

  @ApiProperty({ example: 'Theo' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  prenom: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nom: string;

  @ApiProperty({ example: 'theo.martin@example.com' })
  @IsEmail()
  @MaxLength(180)
  email: string;
}
