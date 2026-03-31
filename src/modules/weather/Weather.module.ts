import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetAirQualityUseCase } from './application/GetAirQuality.useCase';
import { GetEnsembleUseCase } from './application/GetEnsemble.useCase';
import { GetForecastUseCase } from './application/GetForecast.useCase';
import { GetGeocodingUseCase } from './application/GetGeocoding.useCase';
import { GetHistoricalUseCase } from './application/GetHistorical.useCase';
import { GetUserPreferencesUseCase } from './application/GetUserPreferences.useCase';
import { RecordUsageUseCase } from './application/RecordUsage.useCase';
import { UpdateUserPreferencesUseCase } from './application/UpdateUserPreferences.useCase';
import {
  OPENWEATHERMAP_API_KEY,
  OPENWEATHERMAP_PROXY,
  WEATHER_PREFERENCES_REPOSITORY,
  WEATHER_PROXY,
} from './domain/token';
import { OpenMeteoProxyService } from './infrastructure/OpenMeteoProxy.service';
import { OpenWeatherMapProxyService } from './infrastructure/OpenWeatherMapProxy.service';
import { WeatherPreferencesRepositoryTypeORM } from './infrastructure/WeatherPreferences.repository.typeORM';
import { WeatherUserPreferencesEntity } from './infrastructure/entities/WeatherUserPreferences.entity';
import { WeatherController } from './interfaces/Weather.controller';

const WEATHER_USE_CASES = [
  GetGeocodingUseCase,
  GetForecastUseCase,
  GetAirQualityUseCase,
  GetEnsembleUseCase,
  GetHistoricalUseCase,
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
  RecordUsageUseCase,
];

@Module({
  imports: [TypeOrmModule.forFeature([WeatherUserPreferencesEntity])],
  controllers: [WeatherController],
  providers: [
    ...WEATHER_USE_CASES,
    {
      provide: WEATHER_PROXY,
      useClass: OpenMeteoProxyService,
    },
    {
      provide: WEATHER_PREFERENCES_REPOSITORY,
      useClass: WeatherPreferencesRepositoryTypeORM,
    },
    {
      provide: OPENWEATHERMAP_API_KEY,
      useFactory: (config: ConfigService) =>
        config.get<string>('OPENWEATHERMAP_API_KEY', ''),
      inject: [ConfigService],
    },
    {
      provide: OPENWEATHERMAP_PROXY,
      useClass: OpenWeatherMapProxyService,
    },
  ],
})
export class WeatherModule {}
