import { Injectable } from '@nestjs/common';
import { User } from '../domain/User';
import { CasDUsageUtilisateurs } from './CasDUsageUtilisateurs';

@Injectable()
export class DeleteUsersUseCase extends CasDUsageUtilisateurs {
  async execute(id: string): Promise<User> {
    await this.utilisateurExistant(id);
    return this.repo.deactivate(id);
  }
}
