import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { GetAirQualityUseCase } from '../application/GetAirQuality.useCase';
import { GetEnsembleUseCase } from '../application/GetEnsemble.useCase';
import { GetForecastUseCase } from '../application/GetForecast.useCase';
import { GetGeocodingUseCase } from '../application/GetGeocoding.useCase';
import { GetHistoricalUseCase } from '../application/GetHistorical.useCase';
import { GetUserPreferencesUseCase } from '../application/GetUserPreferences.useCase';
import { RecordUsageUseCase } from '../application/RecordUsage.useCase';
import { UpdateUserPreferencesUseCase } from '../application/UpdateUserPreferences.useCase';
import type {
  DetailedCurrentWeather,
  DetailedForecastResult,
  IOpenWeatherMapProxy,
} from '../domain/IOpenWeatherMapProxy.port';
import type {
  AirQualityResult,
  EnsembleResult,
  ForecastResult,
  GeocodingResult,
  HistoricalResult,
} from '../domain/IWeatherProxy.port';
import { OPENWEATHERMAP_PROXY } from '../domain/token';
import { Inject } from '@nestjs/common';
import { DetailedCurrentWeatherDto } from './dto/DetailedCurrentWeather.dto';
import { DetailedForecastDto } from './dto/DetailedForecast.dto';
import { ForecastQueryDto } from './dto/ForecastQuery.dto';
import { GeocodingQueryDto } from './dto/GeocodingQuery.dto';
import { HistoricalQueryDto } from './dto/HistoricalQuery.dto';
import { UpdatePreferencesDto } from './dto/UpdatePreferences.dto';
import { WeatherPreferencesDto } from './dto/WeatherPreferences.dto';

/** Controleur exposant les endpoints meteo. */
@ApiTags('weather')
@Controller('weather')
@UseGuards(RolesGuard)
export class WeatherController {
  constructor(
    private readonly getGeocodingUseCase: GetGeocodingUseCase,
    private readonly getForecastUseCase: GetForecastUseCase,
    private readonly getAirQualityUseCase: GetAirQualityUseCase,
    private readonly getEnsembleUseCase: GetEnsembleUseCase,
    private readonly getHistoricalUseCase: GetHistoricalUseCase,
    private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
    private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase,
    private readonly recordUsageUseCase: RecordUsageUseCase,
    @Inject(OPENWEATHERMAP_PROXY)
    private readonly owmProxy: IOpenWeatherMapProxy,
  ) {}

  /** Recherche de villes par nom (acces public). */
  @Public()
  @Get('geocoding')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async searchCity(@Query() dto: GeocodingQueryDto): Promise<GeocodingResult> {
    return this.getGeocodingUseCase.execute({
      name: dto.name,
      language: dto.language,
      count: dto.count,
    });
  }

  /** Previsions meteo (authentification JWT + role weather requis). */
  @Get('forecast')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getForecast(@Query() dto: ForecastQueryDto): Promise<ForecastResult> {
    return this.getForecastUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
      forecastDays: dto.forecastDays,
    });
  }

  /** Qualite de l'air (role weather requis). */
  @Get('air-quality')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getAirQuality(
    @Query() dto: ForecastQueryDto,
  ): Promise<AirQualityResult> {
    return this.getAirQualityUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  // --- Previsions expert ---

  /** Previsions d'ensemble multi-modeles (role weather requis). */
  @Get('ensemble')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getEnsemble(@Query() dto: ForecastQueryDto): Promise<EnsembleResult> {
    return this.getEnsembleUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  /** Donnees meteo historiques (role weather requis). */
  @Get('historical')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getHistorical(
    @Query() dto: HistoricalQueryDto,
  ): Promise<HistoricalResult> {
    return this.getHistoricalUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  // --- Preferences utilisateur ---

  /** Recupere les preferences meteo de l'utilisateur connecte. */
  @Get('preferences')
  @Roles('weather')
  @ApiBearerAuth()
  async getPreferences(@Req() req: Request): Promise<WeatherPreferencesDto> {
    const user = req.user!;
    const prefs = await this.getUserPreferencesUseCase.execute(user.sub);
    return WeatherPreferencesDto.fromDomain(prefs);
  }

  /** Met a jour les preferences meteo de l'utilisateur connecte. */
  @Patch('preferences')
  @Roles('weather')
  @ApiBearerAuth()
  async updatePreferences(
    @Req() req: Request,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<WeatherPreferencesDto> {
    const user = req.user!;
    const prefs = await this.updateUserPreferencesUseCase.execute({
      userId: user.sub,
      level: dto.level,
      favoriteCities: dto.favoriteCities,
      tooltipsSeen: dto.tooltipsSeen,
      units: dto.units,
    });
    return WeatherPreferencesDto.fromDomain(prefs);
  }

  /** Enregistre l'utilisation du dashboard meteo pour l'utilisateur connecte. */
  @Post('preferences/record-usage')
  @Roles('weather')
  @ApiBearerAuth()
  async recordUsage(@Req() req: Request): Promise<void> {
    const user = req.user!;
    await this.recordUsageUseCase.execute({ userId: user.sub });
  }

  // --- Donnees detaillees (OpenWeatherMap) ---

  /** Donnees meteo detaillees courantes (role weather requis). */
  @Get('current-detailed')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getCurrentDetailed(
    @Query() dto: ForecastQueryDto,
  ): Promise<DetailedCurrentWeatherDto> {
    const data: DetailedCurrentWeather = await this.owmProxy.getCurrentDetailed(
      dto.latitude,
      dto.longitude,
    );
    return DetailedCurrentWeatherDto.fromDomain(data);
  }

  /** Previsions detaillees (role weather requis). */
  @Get('forecast-detailed')
  @Roles('weather')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getForecastDetailed(
    @Query() dto: ForecastQueryDto,
  ): Promise<DetailedForecastDto> {
    const data: DetailedForecastResult =
      await this.owmProxy.getForecastDetailed(dto.latitude, dto.longitude);
    return DetailedForecastDto.fromDomain(data);
  }
}
