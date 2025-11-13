import { Inject, UnauthorizedException } from '@nestjs/common';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import { LoginDto } from './dto/Login.dto';
import { JwtTokenService } from './services/JwtTokenService';
import { PasswordService } from './services/PasswordService';

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: Users;
}

export class AuthenticateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResult> {
    const user = await this.repo.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, expiresIn } = this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: token,
      expiresIn,
      user,
    };
  }
}
