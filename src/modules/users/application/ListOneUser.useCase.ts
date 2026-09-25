import { Injectable } from '@nestjs/common';
import { User } from '../domain/User';
import { CasDUsageUtilisateurs } from './CasDUsageUtilisateurs';

@Injectable()
export class ListOneUserUseCase extends CasDUsageUtilisateurs {
  execute(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }
}
