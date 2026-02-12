import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CookieConsentPreferencesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  essential: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  preferences: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  analytics: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  marketing: boolean;
}

export class CookieConsentDto {
  @ApiProperty({ example: '2026-02-11' })
  @IsString()
  @MaxLength(50)
  policyVersion: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @MaxLength(10)
  locale: string;

  @ApiProperty({ example: 'EU_UK' })
  @IsString()
  @MaxLength(20)
  region: string;

  @ApiProperty({ example: 'banner', enum: ['banner', 'settings'] })
  @IsIn(['banner', 'settings'])
  source: 'banner' | 'settings';

  @ApiProperty({
    example: 'accept_all',
    enum: ['accept_all', 'essential_only', 'save_preferences', 'withdraw'],
  })
  @IsIn(['accept_all', 'essential_only', 'save_preferences', 'withdraw'])
  action: 'accept_all' | 'essential_only' | 'save_preferences' | 'withdraw';

  @ApiProperty({ type: CookieConsentPreferencesDto })
  @ValidateNested()
  @Type(() => CookieConsentPreferencesDto)
  preferences: CookieConsentPreferencesDto;
}
