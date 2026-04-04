import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { DeleteUsersUseCase } from '../application/DeleteUsers.useCase';
import { ListOneUserUseCase } from '../application/ListOneUser.useCase';
import { ListUsersUseCase } from '../application/ListUsers.useCase';
import { UpdateUsersUseCase } from '../application/UpdateUsers.useCase';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserResponseDto } from './dto/User.response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly listOneUserUseCase: ListOneUserUseCase,
    private readonly createUseCase: CreateUsersUseCase,
    private readonly updateUseCase: UpdateUsersUseCase,
    private readonly deleteUseCase: DeleteUsersUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (admin)' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.listUsersUseCase.execute();
    return users.map((user) => UserResponseDto.fromDomain(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer un utilisateur par ID (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Utilisateur non trouve' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.listOneUserUseCase.execute(id);
    return user ? UserResponseDto.fromDomain(user) : null;
  }

  @Post()
  @ApiOperation({ summary: 'Creer un utilisateur (admin)' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUseCase.execute(dto);
    return UserResponseDto.fromDomain(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre a jour un utilisateur (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiNotFoundResponse({ description: 'Utilisateur non trouve' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUseCase.execute(id, dto);
    return UserResponseDto.fromDomain(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Utilisateur non trouve' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.deleteUseCase.execute(id);
    return UserResponseDto.fromDomain(user);
  }
}
