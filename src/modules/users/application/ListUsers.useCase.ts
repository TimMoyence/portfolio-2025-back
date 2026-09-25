import { Injectable } from '@nestjs/common';
import { User } from '../domain/User';
import { CasDUsageUtilisateurs } from './CasDUsageUtilisateurs';

@Injectable()
export class ListUsersUseCase extends CasDUsageUtilisateurs {
  execute(): Promise<User[]> {
    return this.repo.findAll();
  }
}
