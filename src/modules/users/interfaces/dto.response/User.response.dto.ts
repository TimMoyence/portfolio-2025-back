import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Users } from '../../domain/Users';

export class UserResponseDto {
  @ApiProperty({ example: '08bcd3fe-0d1d-4db6-9ee4-5a6a65c13c45' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: '+11234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: String, example: '2025-01-01T00:00:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ type: String, example: '2025-01-02T00:00:00.000Z' })
  updatedAt?: Date;

  @ApiPropertyOptional({ example: 'system', nullable: true })
  updatedOrCreatedBy: string | null;

  static fromDomain(user: Users): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id ?? '';
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone ?? null;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.updatedOrCreatedBy = user.updatedOrCreatedBy ?? null;
    return dto;
  }
}
