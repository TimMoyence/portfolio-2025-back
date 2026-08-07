import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export class SelfAuditForbiddenError extends DomainValidationError {
  constructor(hostname: string) {
    super(`Self-audit is not allowed for domain "${hostname}".`);
  }
}

export class SelfAuditGuard {
  private readonly selfHostnames: ReadonlySet<string>;

  constructor(selfDomains: ReadonlyArray<string>) {
    this.selfHostnames = new Set(
      selfDomains
        .map((entry) => this.extractHostname(entry))
        .filter((hostname) => hostname.length > 0),
    );
  }

  ensureNotSelf(websiteName: string): void {
    const hostname = this.extractHostname(websiteName);
    if (hostname.length === 0) return;
    if (this.matches(hostname)) {
      throw new SelfAuditForbiddenError(hostname);
    }
  }

  private extractHostname(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return '';
    const withoutScheme = trimmed.replace(/^[a-z][a-z\d+\-.]*:\/\//, '');
    const [hostAndPort] = withoutScheme.split('/');
    const [host] = hostAndPort.split(':');
    return host.replace(/^www\./, '');
  }

  private matches(hostname: string): boolean {
    if (this.selfHostnames.has(hostname)) return true;
    for (const self of this.selfHostnames) {
      if (hostname.endsWith(`.${self}`)) return true;
    }
    return false;
  }
}
