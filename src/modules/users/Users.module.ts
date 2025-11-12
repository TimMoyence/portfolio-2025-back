import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "./infrastructure/entities/Users.entity";
import { UsersRepositoryTypeORM } from "./infrastructure/UsersRepositoryTypeORM";
import { UsersController } from "./interfaces/UsersController";
import {USERS_REPOSITORY} from "./domain/token";
import { CreateUsersUseCase } from "./application/CreateUsersUseCase";

const USERS_USE_CASES = [CreateUsersUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity])],
  controllers: [UsersController],
  providers: [
    ...USERS_USE_CASES,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepositoryTypeORM,
    },
  ],
exports: [USERS_REPOSITORY],
})
export class UsersModule {}
