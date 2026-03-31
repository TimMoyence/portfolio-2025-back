import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNumber, Max, Min, Validate } from 'class-validator';
import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

/** Plage maximale autorisee pour les requetes historiques (365 jours). */
const MAX_HISTORICAL_RANGE_DAYS = 365;

@ValidatorConstraint({ name: 'historicalDateRange', async: false })
class HistoricalDateRangeValidator implements ValidatorConstraintInterface {
  validate(_value: string, args: ValidationArguments): boolean {
    const obj = args.object as HistoricalQueryDto;
    if (!obj.startDate || !obj.endDate) return true;

    const start = new Date(obj.startDate);
    const end = new Date(obj.endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (start >= end) return false;
    if (end > today) return false;

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_HISTORICAL_RANGE_DAYS;
  }

  defaultMessage(): string {
    return `startDate doit preceder endDate, endDate ne doit pas depasser aujourd'hui, et la plage ne doit pas exceder ${MAX_HISTORICAL_RANGE_DAYS} jours`;
  }
}

/** DTO de validation pour les requetes de donnees meteo historiques. */
export class HistoricalQueryDto {
  @ApiProperty({ example: 48.8566, description: 'Latitude' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 2.3522, description: 'Longitude' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Date de debut (format ISO)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-01-31',
    description: 'Date de fin (format ISO, max 365 jours, passe uniquement)',
  })
  @IsDateString()
  @Validate(HistoricalDateRangeValidator)
  endDate: string;
}
