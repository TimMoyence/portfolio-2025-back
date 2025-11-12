import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServicesEntity } from "./infrastructure/entities/Services.entity";
import { ServicesRepositoryTypeORM } from "./infrastructure/ServicesRepositoryTypeORM";
import { ServicesController } from "./interfaces/ServicesController";
import {SERVICES_REPOSITORY} from "./domain/token";
import { CreateServicesUseCase } from "./application/CreateServicesUseCase";

const SERVICES_USE_CASES = [CreateServicesUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([ServicesEntity])],
  controllers: [ServicesController],
  providers: [
    ...SERVICES_USE_CASES,
    {
      provide: SERVICES_REPOSITORY,
      useClass: ServicesRepositoryTypeORM,
    },
  ],
exports: [SERVICES_REPOSITORY],
})
export class ServicesModule {}
