import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { DeleteUsersUseCase } from '../application/DeleteUsers.useCase';
import { ListOneUserUseCase } from '../application/ListOneUser.useCase';
import { ListUsersUseCase } from '../application/ListUsers.useCase';
import { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import { CreateUserDto } from '../application/dto/CreateUserDto';
import { UpdateUserDto } from '../application/dto/UpdateUserDto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly listOneUserUseCase: ListOneUserUseCase,
    private readonly createUseCase: CreateUsersUseCase,
    private readonly updateUseCase: UpdateUsersUseCase,
    private readonly deleteUseCase: DeleteUsersUseCase,
  ) {}

  @Get()
  findAll() {
    return this.listUsersUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listOneUserUseCase.execute(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUseCase.execute(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.deleteUseCase.execute(id);
  }
}
