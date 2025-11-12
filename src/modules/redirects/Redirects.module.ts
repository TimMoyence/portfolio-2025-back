import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedirectsEntity } from "./infrastructure/entities/Redirects.entity";
import { RedirectsRepositoryTypeORM } from "./infrastructure/RedirectsRepositoryTypeORM";
import { RedirectsController } from "./interfaces/RedirectsController";
import {REDIRECTS_REPOSITORY} from "./domain/token";
import { CreateRedirectsUseCase } from "./application/CreateRedirectsUseCase";

const REDIRECTS_USE_CASES = [CreateRedirectsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([RedirectsEntity])],
  controllers: [RedirectsController],
  providers: [
    ...REDIRECTS_USE_CASES,
    {
      provide: REDIRECTS_REPOSITORY,
      useClass: RedirectsRepositoryTypeORM,
    },
  ],
exports: [REDIRECTS_REPOSITORY],
})
export class RedirectsModule {}
