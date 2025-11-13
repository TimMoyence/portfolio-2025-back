import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { DeleteUsersUseCase } from '../application/DeleteUsers.useCase';
import { ListOneUserUseCase } from '../application/ListOneUser.useCase';
import { ListUsersUseCase } from '../application/ListUsers.useCase';
import { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import { CreateUserDto } from '../application/dto/CreateUser.dto';
import { UpdateUserDto } from '../application/dto/UpdateUser.dto';
import { UserResponseDto } from './dto.response/User.response.dto';

@ApiTags('users')
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
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.listUsersUseCase.execute();
    return users.map(UserResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto | null> {
    const user = await this.listOneUserUseCase.execute(id);
    return user ? UserResponseDto.fromDomain(user) : null;
  }

  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUseCase.execute(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUseCase.execute(id, dto);
    return UserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.deleteUseCase.execute(id);
    return UserResponseDto.fromDomain(user);
  }
}
