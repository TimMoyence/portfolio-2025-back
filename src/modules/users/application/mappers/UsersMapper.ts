import { Users } from '../../domain/Users';
import { CreateUserDto } from '../dto/CreateUserDto';
import { UpdateUserDto } from '../dto/UpdateUserDto';

export class UsersMapper {
  static fromCreateDto(dto: CreateUserDto): Users {
    return {
      email: dto.email,
      passwordHash: dto.passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: dto.updatedOrCreatedBy ?? null,
    };
  }

  static fromUpdateDto(dto: UpdateUserDto): Partial<Users> {
    const partial: Partial<Users> = {};

    if (dto.email !== undefined) partial.email = dto.email;
    if (dto.passwordHash !== undefined) partial.passwordHash = dto.passwordHash;
    if (dto.firstName !== undefined) partial.firstName = dto.firstName;
    if (dto.lastName !== undefined) partial.lastName = dto.lastName;
    if (dto.phone !== undefined) partial.phone = dto.phone;
    if (dto.isActive !== undefined) partial.isActive = dto.isActive;
    if (dto.updatedOrCreatedBy !== undefined)
      partial.updatedOrCreatedBy = dto.updatedOrCreatedBy;

    partial.updatedAt = new Date();

    return partial;
  }
}
