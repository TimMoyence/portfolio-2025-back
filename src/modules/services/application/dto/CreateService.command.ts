import { ServiceStatus } from '../../domain/Services';

export interface CreateServiceCommand {
  slug: string;
  name: string;
  icon?: string;
  status?: ServiceStatus;
  order?: number;
}
