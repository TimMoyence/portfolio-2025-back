import {
  requireText,
  optionalText,
} from '../../../common/domain/validation/domain-validators';
import {
  resolvePublishableStatus,
  resolveOrder,
} from '../../../common/domain/validation/status-order.utils';
import { Slug } from '../../../common/domain/value-objects/Slug';
import { PublishableStatus } from '../../../common/domain/types/publishable-status';

export type ServiceStatus = PublishableStatus;

export interface CreateServiceProps {
  slug: string;
  name: string;
  icon?: string | null;
  status?: ServiceStatus;
  order?: number;
}

/** Entite domaine representant un service propose dans le portfolio. */
export class Services {
  id?: string;
  slug: string;
  name: string;
  icon?: string;
  status: ServiceStatus;
  order: number;

  static create(props: CreateServiceProps): Services {
    const service = new Services();
    service.slug = Slug.parse(props.slug, 'service slug').toString();
    service.name = requireText(props.name, 'service name', 2, 120);
    service.icon = optionalText(props.icon, 'service icon', 500);
    service.status = resolvePublishableStatus(props.status, 'service status');
    service.order = resolveOrder(props.order, 'service order');
    return service;
  }
}
