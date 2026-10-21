import { OmitType } from '@nestjs/swagger';
import type { InscriptionCommand } from '../../application/dto/CreateUser.command';
import { CreateUserDto } from './CreateUser.dto';

export class InscriptionDto
  extends OmitType(CreateUserDto, ['roles', 'isActive'] as const)
  implements InscriptionCommand {}
