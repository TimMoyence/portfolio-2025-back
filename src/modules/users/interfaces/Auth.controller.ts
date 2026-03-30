import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import type { JwtPayload } from '../application/services/JwtPayload';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { CreateUserDto } from './dto/CreateUser.dto';
import { LoginDto } from './dto/Login.dto';
import { AuthResponseDto } from './dto/Auth.response.dto';
import { UserResponseDto } from './dto/User.response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Public()
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
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive user',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = req['user'] as JwtPayload;
    const updatedUser = await this.changePasswordUseCase.execute({
      ...dto,
      userId: user.sub,
    });
    return UserResponseDto.fromDomain(updatedUser);
  }

  @Post('register')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Registration failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.createUsersUseCase.execute(dto);
    return UserResponseDto.fromDomain(result);
  }
}
