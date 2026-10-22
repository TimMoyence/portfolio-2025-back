import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { adresseDuSite } from './AdresseDuSite';

export class SelfAuditForbiddenError extends DomainValidationError {
  constructor(hostname: string) {
    super(`Self-audit is not allowed for domain "${hostname}".`);
  }
}

export class SelfAuditGuard {
  private readonly selfHostnames: ReadonlySet<string>;

  constructor(selfDomains: ReadonlyArray<string>) {
    this.selfHostnames = new Set(selfDomains.map(domaineDuSite));
  }

  ensureNotSelf(websiteName: string): void {
    const hostname = domaineDuSite(websiteName);
    if (this.matches(hostname)) {
      throw new SelfAuditForbiddenError(hostname);
    }
  }

  private matches(hostname: string): boolean {
    if (this.selfHostnames.has(hostname)) return true;
    for (const self of this.selfHostnames) {
      if (hostname.endsWith(`.${self}`)) return true;
    }
    return false;
  }
}

function domaineDuSite(saisie: string): string {
  return adresseDuSite(saisie)
    .hostname.replace(/^www\./, '')
    .replace(/\.$/, '');
}
