import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CreateServiceProps {
  slug: string;
  name: string;
  icon?: string | null;
  status?: ServiceStatus;
  order?: number;
}

export class Services {
  id?: string;
  slug: string;
  name: string;
  icon?: string;
  status: ServiceStatus;
  order: number;

  static create(props: CreateServiceProps): Services {
    const service = new Services();
    service.slug = this.requireSlug(props.slug, 'service slug');
    service.name = this.requireText(props.name, 'service name', 2, 120);
    service.icon = this.optionalText(props.icon, 'service icon', 500);
    service.status = this.resolveStatus(props.status);
    service.order = this.resolveOrder(props.order);
    return service;
  }

  private static requireSlug(raw: unknown, field: string): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const slug = raw.trim().toLowerCase();
    if (slug.length < 2 || slug.length > 120) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return slug;
  }

  private static requireText(
    raw: unknown,
    field: string,
    min: number,
    max: number,
  ): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const value = raw.trim();
    if (value.length < min || value.length > max) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return value;
  }

  private static optionalText(
    raw: unknown,
    field: string,
    max: number,
  ): string | undefined {
    if (raw === undefined || raw === null) {
      return undefined;
    }

    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const value = raw.trim();
    if (value.length === 0) {
      return undefined;
    }

    if (value.length > max) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return value;
  }

  private static resolveStatus(raw: unknown): ServiceStatus {
    if (raw === undefined || raw === null) {
      return 'PUBLISHED';
    }

    if (typeof raw !== 'string') {
      throw new DomainValidationError('Invalid service status');
    }

    const normalized = raw.trim().toUpperCase();
    if (
      normalized !== 'DRAFT' &&
      normalized !== 'PUBLISHED' &&
      normalized !== 'ARCHIVED'
    ) {
      throw new DomainValidationError('Invalid service status');
    }

    return normalized;
  }

  private static resolveOrder(raw: unknown): number {
    if (raw === undefined || raw === null) {
      return 0;
    }

    if (!Number.isInteger(raw)) {
      throw new DomainValidationError('Invalid service order');
    }

    const value = Number(raw);
    if (value < 0 || value > 10000) {
      throw new DomainValidationError('Invalid service order');
    }

    return value;
  }
}
