import { PartialType } from '@nestjs/swagger';
import type { UpdateUserCommand } from '../../application/dto/UpdateUser.command';
import { CreateUserDto } from './CreateUser.dto';

export class UpdateUserDto
  extends PartialType(CreateUserDto)
  implements UpdateUserCommand {}
