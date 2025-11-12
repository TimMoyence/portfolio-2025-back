import { Users } from './Users';

export interface IUsersRepository {
  findAll(): Promise<Users[]>;
  create(data: Users): Promise<Users>;
}
