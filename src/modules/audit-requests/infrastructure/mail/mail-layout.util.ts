import { escapeHtml } from './mail-rendering.util';

/**
 * Entree du layout email Asili Design (P2.7). Factorise les elements
 * communs a tous les mailers (notification, client report, expert report)
 * pour garantir coherence visuelle, branding et conformite RGPD.
 */
export interface MailLayoutInput {
  /** Titre affiche dans le hero noir (accent de la marque). */
  readonly heroTitle: string;
  /** Sous-titre gris affiche sous le hero title (optionnel). */
  readonly heroSubtitle?: string;
  /**
   * HTML du corps principal, entre le hero et le footer. Doit etre deja
   * echappe par l'appelant pour les champs d'origine externe/LLM.
   */
  readonly bodyHtml: string;
  /** Preheader visible dans l'inbox preview (mobile), 40-130 car. */
  readonly preheader?: string;
  /**
   * Si true, insere un bloc "desinscrire" sous le footer. Reserve aux
   * envois client (externes) pour conformite CAN-SPAM/RGPD. Omettre
   * pour les mails internes (notification Tim, rapport expert).
   */
  readonly showUnsubscribe?: boolean;
  /**
   * Lien unsubscribe personnalise. Si `showUnsubscribe=true` et cette
   * URL n'est pas fournie, fallback sur
   * `process.env.AUDIT_UNSUBSCRIBE_URL` puis `/fr/contact`.
   */
  readonly unsubscribeUrl?: string;
}

const LOGO_URL =
  process.env.AUDIT_BRAND_LOGO_URL ??
  'https://asilidesign.fr/assets/images/logo.webp';
const LOGO_ALT = 'Asili Design — Tim Moyence';
const BRAND_FOOTER_ADDRESS = 'Asili Design — Bordeaux, France';
const BRAND_FOOTER_CONTACT = 'tim.moyence@outlook.fr';

function resolveUnsubscribeUrl(explicit?: string): string {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  const fromEnv = process.env.AUDIT_UNSUBSCRIBE_URL?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return 'https://asilidesign.fr/fr/contact';
}

/**
 * Construit un HTML email complet en 640px max-width avec DOCTYPE, meta
 * viewport, color-scheme (dark-mode compatible), logo en header, hero
 * branded et footer legal. Usage : les 3 mailers audit-requests
 * appellent cette fonction au lieu de rebuilder a la main leur HTML.
 *
 * Le design suit les bonnes pratiques email 2026 : tableaux evites au
 * profit de div+flex (Gmail/Outlook modernes supportent), pas de CSS
 * externe, styles inline avec quelques `@media (prefers-color-scheme)`
 * pour le dark mode.
 */
export function buildMailLayout(input: MailLayoutInput): string {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff;opacity:0;">${escapeHtml(input.preheader)}</div>`
    : '';

  const subtitleHtml = input.heroSubtitle
    ? `<p style="margin:8px 0 0 0;font-size:15px;color:#d1d5db;">${escapeHtml(input.heroSubtitle)}</p>`
    : '';

  const unsubscribeHtml = input.showUnsubscribe
    ? `<p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;text-align:center;">
        <a href="${escapeHtml(resolveUnsubscribeUrl(input.unsubscribeUrl))}" style="color:#9ca3af;text-decoration:underline;">Ne plus recevoir ce type d'email</a>
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(input.heroTitle)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    body, .bg-surface { background-color: #0b0b0d !important; color: #f5f5f5 !important; }
    .bg-card { background-color: #1a1a1d !important; color: #f5f5f5 !important; }
    .text-muted { color: #9ca3af !important; }
    .divider { border-color: #27272a !important; }
    a { color: #60a5fa !important; }
  }
  @media (max-width: 600px) {
    .hero-title { font-size: 20px !important; }
    .hero-subtitle { font-size: 14px !important; }
    .card { padding: 20px !important; }
  }
</style>
</head>
<body class="bg-surface" style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
${preheader}
<div role="article" aria-roledescription="email" lang="fr" style="padding:24px 12px;">
  <div style="max-width:640px;margin:0 auto;">
    <!-- Header logo -->
    <div style="padding:12px 24px 20px 24px;text-align:center;">
      <a href="https://asilidesign.fr" style="text-decoration:none;">
        <img src="${escapeHtml(LOGO_URL)}" alt="${escapeHtml(LOGO_ALT)}" width="56" height="56" style="display:inline-block;width:56px;height:56px;border:0;" />
      </a>
    </div>

    <!-- Hero -->
    <div style="background:#111;color:#fff;border-radius:12px 12px 0 0;padding:28px 24px;">
      <h1 class="hero-title" style="margin:0;font-size:22px;font-weight:700;line-height:1.3;color:#fff;">${escapeHtml(input.heroTitle)}</h1>
      ${subtitleHtml}
    </div>

    <!-- Card content -->
    <div class="card bg-card" style="background:#ffffff;border-radius:0 0 12px 12px;padding:28px 24px;color:#111827;font-size:15px;line-height:1.6;">
      ${input.bodyHtml}
    </div>

    <!-- Footer legal -->
    <div style="margin-top:24px;padding:0 16px;text-align:center;">
      <p class="text-muted" style="margin:0;font-size:12px;color:#6b7280;">
        ${escapeHtml(BRAND_FOOTER_ADDRESS)} &middot;
        <a href="mailto:${escapeHtml(BRAND_FOOTER_CONTACT)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(BRAND_FOOTER_CONTACT)}</a>
      </p>
      <p class="text-muted" style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">
        <a href="https://asilidesign.fr/fr/privacy" style="color:#6b7280;text-decoration:underline;">Politique de confidentialité</a>
        &middot;
        <a href="https://asilidesign.fr/fr/terms" style="color:#6b7280;text-decoration:underline;">Conditions d'utilisation</a>
      </p>
      ${unsubscribeHtml}
    </div>
  </div>
</div>
</body>
</html>`;
}
