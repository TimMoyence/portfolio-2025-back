import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { requireHttpUrl } from '../../../common/domain/validation/domain-validators';
import { resolveCompteurBorne } from '../../../common/domain/validation/status-order.utils';
import { Slug } from '../../../common/domain/value-objects/Slug';

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
    redirect.slug = Slug.parse(props.slug, 'redirect slug').toString();
    redirect.targetUrl = requireHttpUrl(props.targetUrl, 'redirect target URL');
    redirect.enabled = this.resolveEnabled(props.enabled);
    redirect.clicks = this.resolveClicks(props.clicks);
    return redirect;
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
    return resolveCompteurBorne(raw, 'redirect clicks count', 1000000000);
  }
}
