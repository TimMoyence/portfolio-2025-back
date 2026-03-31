import { Users } from './Users';

/** Port de persistance pour les utilisateurs. */
export interface IUsersRepository {
  findAll(): Promise<Users[]>;
  create(data: Users): Promise<Users>;
  findById(id: string): Promise<Users | null>;
  findByEmail(email: string): Promise<Users | null>;
  findByGoogleId(googleId: string): Promise<Users | null>;
  update(id: string, data: Partial<Users>): Promise<Users>;
  deactivate(id: string): Promise<Users>;
}
