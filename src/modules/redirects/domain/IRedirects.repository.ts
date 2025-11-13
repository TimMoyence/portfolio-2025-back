import { Redirects } from './Redirects';

export interface IRedirectsRepository {
  findAll(): Promise<Redirects[]>;
  create(data: Redirects): Promise<Redirects>;
}
