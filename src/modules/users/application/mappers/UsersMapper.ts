import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Users } from '../../domain/Users';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { UpdateUserDto } from '../dto/UpdateUser.dto';

export class UsersMapper {
  static fromCreateDto(dto: CreateUserDto, passwordHash: string): Users {
    try {
      return Users.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        isActive: dto.isActive ?? true,
        updatedOrCreatedBy: dto.updatedOrCreatedBy ?? null,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  static fromUpdateDto(
    dto: UpdateUserDto,
    passwordHash?: string,
  ): Partial<Users> {
    try {
      return Users.update({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        isActive: dto.isActive,
        updatedOrCreatedBy: dto.updatedOrCreatedBy,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
