import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUsersUseCase } from './application/CreateUsers.useCase';
import { DeleteUsersUseCase } from './application/DeleteUsers.useCase';
import { ListUsersUseCase } from './application/ListUsers.useCase';
import { ListOneUserUseCase } from './application/ListOneUser.useCase';
import { UpdateUsersUseCase } from './application/UpdateUsers.useCase';
import { USERS_REPOSITORY } from './domain/token';
import { UsersEntity } from './infrastructure/entities/Users.entity';
import { UsersRepositoryTypeORM } from './infrastructure/Users.repository.typeORM';
import { UsersController } from './interfaces/Users.controller';

const USERS_USE_CASES = [
  ListUsersUseCase,
  ListOneUserUseCase,
  CreateUsersUseCase,
  UpdateUsersUseCase,
  DeleteUsersUseCase,
];

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
