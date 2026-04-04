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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { GetWeatherAlertsUseCase } from '../application/GetWeatherAlerts.useCase';
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
  WeatherAlertResult,
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
    private readonly getWeatherAlertsUseCase: GetWeatherAlertsUseCase,
    @Inject(OPENWEATHERMAP_PROXY)
    private readonly owmProxy: IOpenWeatherMapProxy,
  ) {}

  /** Recherche de villes par nom (acces public). */
  @Public()
  @Get('geocoding')
  @ApiOperation({ summary: 'Rechercher des villes par nom (acces public)' })
  @ApiOkResponse({ description: 'Liste des villes correspondantes' })
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
  @ApiOperation({ summary: 'Obtenir les previsions meteo' })
  @ApiOkResponse({
    description: 'Previsions meteo pour les coordonnees donnees',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
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
  @ApiOperation({ summary: "Obtenir l'indice de qualite de l'air" })
  @ApiOkResponse({ description: "Donnees de qualite de l'air" })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
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
  @ApiOperation({ summary: "Obtenir les previsions d'ensemble multi-modeles" })
  @ApiOkResponse({ description: "Previsions d'ensemble multi-modeles" })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
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
  @ApiOperation({ summary: 'Obtenir les donnees meteo historiques' })
  @ApiOkResponse({ description: 'Donnees meteo historiques' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
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

  /** Alertes meteo synthetiques pour des coordonnees donnees. */
  @Get('alerts')
  @Roles('weather')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir les alertes meteo synthetiques' })
  @ApiOkResponse({ description: 'Alertes meteo pour les coordonnees donnees' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getAlerts(@Query() dto: ForecastQueryDto): Promise<WeatherAlertResult> {
    return this.getWeatherAlertsUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  // --- Preferences utilisateur ---

  /** Recupere les preferences meteo de l'utilisateur connecte. */
  @Get('preferences')
  @Roles('weather')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Recuperer les preferences meteo de l'utilisateur" })
  @ApiOkResponse({
    description: 'Preferences meteo',
    type: WeatherPreferencesDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async getPreferences(@Req() req: Request): Promise<WeatherPreferencesDto> {
    const user = req.user!;
    const prefs = await this.getUserPreferencesUseCase.execute(user.sub);
    return WeatherPreferencesDto.fromDomain(prefs);
  }

  /** Met a jour les preferences meteo de l'utilisateur connecte. */
  @Patch('preferences')
  @Roles('weather')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mettre a jour les preferences meteo de l'utilisateur",
  })
  @ApiOkResponse({
    description: 'Preferences meteo mises a jour',
    type: WeatherPreferencesDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async updatePreferences(
    @Req() req: Request,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<WeatherPreferencesDto> {
    const user = req.user!;
    const prefs = await this.updateUserPreferencesUseCase.execute({
      userId: user.sub,
      level: dto.level,
      favoriteCities: dto.favoriteCities,
      defaultCityIndex: dto.defaultCityIndex,
      tooltipsSeen: dto.tooltipsSeen,
      units: dto.units,
      overviewGranularity: dto.overviewGranularity as
        | 'day'
        | '3h'
        | '1h'
        | undefined,
    });
    return WeatherPreferencesDto.fromDomain(prefs);
  }

  /** Enregistre l'utilisation du dashboard meteo pour l'utilisateur connecte. */
  @Post('preferences/record-usage')
  @Roles('weather')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enregistrer l'utilisation du dashboard meteo" })
  @ApiOkResponse({ description: 'Utilisation enregistree' })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async recordUsage(@Req() req: Request): Promise<void> {
    const user = req.user!;
    await this.recordUsageUseCase.execute({ userId: user.sub });
  }

  // --- Donnees detaillees (OpenWeatherMap) ---

  /** Donnees meteo detaillees courantes (role weather requis). */
  @Get('current-detailed')
  @Roles('weather')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtenir les donnees meteo detaillees courantes (OpenWeatherMap)',
  })
  @ApiOkResponse({
    description: 'Donnees meteo detaillees courantes',
    type: DetailedCurrentWeatherDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
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
  @ApiOperation({
    summary: 'Obtenir les previsions detaillees (OpenWeatherMap)',
  })
  @ApiOkResponse({
    description: 'Previsions detaillees',
    type: DetailedForecastDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getForecastDetailed(
    @Query() dto: ForecastQueryDto,
  ): Promise<DetailedForecastDto> {
    const data: DetailedForecastResult =
      await this.owmProxy.getForecastDetailed(dto.latitude, dto.longitude);
    return DetailedForecastDto.fromDomain(data);
  }
}
