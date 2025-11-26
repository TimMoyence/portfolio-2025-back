import { Body, Controller, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { ChangePasswordDto } from '../application/dto/ChangePassword.dto';
import { CreateUserDto } from '../application/dto/CreateUser.dto';
import { LoginDto } from '../application/dto/Login.dto';
import { AuthResponseDto } from './dto.response/Auth.response.dto';
import { UserResponseDto } from './dto.response/User.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.authenticateUserUseCase.execute(dto);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: UserResponseDto.fromDomain(result.user),
    };
  }

  @Patch('change-password')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive user',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.changePasswordUseCase.execute(dto);
    return UserResponseDto.fromDomain(updatedUser);
  }

  @Post('register')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Registration failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.createUsersUseCase.execute(dto);
    return UserResponseDto.fromDomain(result);
  }
}
