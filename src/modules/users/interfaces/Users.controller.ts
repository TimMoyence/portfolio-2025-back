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
import { ListUsersUseCase } from '../application/ListUsers.useCase';
import { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import { Users } from '../domain/Users';
import { ListOneUserUseCase } from '../application/ListOneUser.useCase';

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
  findAll(): Promise<Users[]> {
    return this.listUsersUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Users | null> {
    return this.listOneUserUseCase.execute(id);
  }

  @Post()
  create(@Body() dto: Users): Promise<Users> {
    return this.createUseCase.execute(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Users>): Promise<Users> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<Users> {
    return this.deleteUseCase.execute(id);
  }
}
