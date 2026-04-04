import { User } from './User';

/** Port de persistance pour les utilisateurs. */
export interface IUsersRepository {
  findAll(): Promise<User[]>;
  create(data: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  deactivate(id: string): Promise<User>;
}
