import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

/**
 * Erreur levee lorsqu'on tente de declencher un audit sur un domaine
 * appartenant a l'operateur du service (p. ex. `asilidesign.fr`). L'audit
 * est refuse pour eviter l'envoi de livrables (rapport client, draft mail
 * commercial) adresses a soi-meme.
 *
 * Herite de {@link DomainValidationError} pour beneficier du mapping
 * HTTP 400 du filtre global.
 */
export class SelfAuditForbiddenError extends DomainValidationError {
  constructor(hostname: string) {
    super(`Self-audit is not allowed for domain "${hostname}".`);
  }
}

/**
 * Garde domaine pure qui refuse les audits sur les domaines "self"
 * configures par l'operateur. Le service accepte :
 * - un schema (`http://`, `https://`) optionnel,
 * - un prefixe `www.` optionnel,
 * - un port et un chemin ignores,
 * - la casse (normalisee en minuscules).
 *
 * La garde matche a la fois le domaine exact et ses sous-domaines
 * (`api.asilidesign.fr` est considere comme "self" si `asilidesign.fr`
 * figure dans la liste).
 *
 * Instanciee une fois par module via useFactory (voir AuditRequestsModule).
 */
export class SelfAuditGuard {
  private readonly selfHostnames: ReadonlySet<string>;

  constructor(selfDomains: ReadonlyArray<string>) {
    this.selfHostnames = new Set(
      selfDomains
        .map((entry) => this.extractHostname(entry))
        .filter((hostname) => hostname.length > 0),
    );
  }

  /**
   * Leve {@link SelfAuditForbiddenError} si `websiteName` resout vers un
   * hostname appartenant a la liste des domaines "self". No-op sinon.
   */
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
