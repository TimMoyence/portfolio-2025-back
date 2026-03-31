import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticateGoogleUserUseCase } from '../application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { JwtPayload } from '../application/services/JwtPayload';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { CreateUserDto } from './dto/CreateUser.dto';
import { GoogleAuthDto } from './dto/GoogleAuth.dto';
import { LoginDto } from './dto/Login.dto';
import { AuthResponseDto } from './dto/Auth.response.dto';
import { UserResponseDto } from './dto/User.response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly authenticateGoogleUserUseCase: AuthenticateGoogleUserUseCase,
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
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

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('google')
  @ApiOperation({ summary: 'Authentification via Google OAuth' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid Google token' })
  async googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponseDto> {
    const result = await this.authenticateGoogleUserUseCase.execute(
      dto.idToken,
    );
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

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Registration failed' })
  async register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.createUsersUseCase.execute(dto);
    return UserResponseDto.fromDomain(result);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async me(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req['user'] as JwtPayload;
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }
}
