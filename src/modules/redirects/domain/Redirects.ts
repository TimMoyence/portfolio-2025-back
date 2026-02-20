import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export interface CreateRedirectProps {
  slug: string;
  targetUrl: string;
  enabled?: boolean;
  clicks?: number;
}

export class Redirects {
  id?: string;
  slug: string;
  targetUrl: string;
  enabled: boolean;
  clicks: number;

  static create(props: CreateRedirectProps): Redirects {
    const redirect = new Redirects();
    redirect.slug = this.requireSlug(props.slug, 'redirect slug');
    redirect.targetUrl = this.requireUrl(props.targetUrl, 'redirect target URL');
    redirect.enabled = this.resolveEnabled(props.enabled);
    redirect.clicks = this.resolveClicks(props.clicks);
    return redirect;
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

  private static requireUrl(raw: unknown, field: string): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const value = raw.trim();
    if (value.length === 0 || value.length > 1000) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return value;
  }

  private static resolveEnabled(raw: unknown): boolean {
    if (raw === undefined || raw === null) {
      return true;
    }

    if (typeof raw !== 'boolean') {
      throw new DomainValidationError('Invalid redirect enabled flag');
    }

    return raw;
  }

  private static resolveClicks(raw: unknown): number {
    if (raw === undefined || raw === null) {
      return 0;
    }

    if (!Number.isInteger(raw)) {
      throw new DomainValidationError('Invalid redirect clicks count');
    }

    const value = Number(raw);
    if (value < 0 || value > 1000000000) {
      throw new DomainValidationError('Invalid redirect clicks count');
    }

    return value;
  }
}
