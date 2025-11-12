import { Services } from './Services';

export interface IServicesRepository {
  findAll(): Promise<Services[]>;
  create(data: Services): Promise<Services>;
}
