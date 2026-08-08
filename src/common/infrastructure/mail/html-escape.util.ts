declare const escapedHtmlBrand: unique symbol;

export type EscapedHtml = string & {
  readonly [escapedHtmlBrand]: 'EscapedHtml';
};

type HtmlFragment = EscapedHtml | number | readonly EscapedHtml[];

export function escapeHtml(value: unknown): EscapedHtml {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;') as EscapedHtml;
}

const ALLOWED_URL_SCHEMES: ReadonlySet<string> = new Set([
  'http:',
  'https:',
  'mailto:',
]);

const INERT_URL = '#' as EscapedHtml;

function absoluteScheme(raw: string): string | null {
  try {
    return new URL(raw).protocol;
  } catch {
    return null;
  }
}

/**
 * Le parseur de https://url.spec.whatwg.org/#concept-basic-url-parser retire
 * les tabulations et sauts de ligne de l'entree et met le schema en
 * minuscules : `new URL` ramene `JaVaScRiPt:`, `java<TAB>script:` et
 * ` javascript:` au meme `protocol`, sans normalisation maison. Une entree
 * sans schema valide fait lever le parseur : c'est une reference relative,
 * qui heritera du schema du document.
 *
 * Le refus rend `#` et non la chaine vide : par RFC 3986 section 4.2, une
 * reference vide designe le document courant, donc `href=""` reste un lien
 * actif.
 */
export function escapeUrl(value: unknown): EscapedHtml {
  const raw = String(value);
  if (!raw.trim()) return INERT_URL;
  const scheme = absoluteScheme(raw);
  if (scheme === null) return escapeHtml(raw);
  return ALLOWED_URL_SCHEMES.has(scheme) ? escapeHtml(raw) : INERT_URL;
}

/**
 * Assemble un gabarit HTML dont chaque interpolation est deja sure : le
 * compilateur rejette toute `string` qui n'est pas passee par `escapeHtml`
 * ou par un autre `safeHtml`. Les nombres sont acceptes tels quels, les
 * tableaux de fragments sont concatenes.
 *
 * Sans interpolation, le gabarit est un litteral ecrit par nous : c'est la
 * seule facon de produire du HTML brut, et elle ne peut pas transporter de
 * donnee externe. Il n'existe donc aucune echappatoire a marquer.
 *
 * Le tag ne s'appelle pas `html` a dessein : Prettier reformaterait alors
 * le contenu du gabarit, ce qui modifierait le rendu des blocs ou les
 * blancs comptent (`<pre>`, `<style>`).
 */
export function safeHtml(
  strings: TemplateStringsArray,
  ...values: readonly HtmlFragment[]
): EscapedHtml {
  let out = strings[0];
  for (const [index, value] of values.entries()) {
    out += Array.isArray(value) ? value.join('') : String(value);
    out += strings[index + 1];
  }
  return out as EscapedHtml;
}
