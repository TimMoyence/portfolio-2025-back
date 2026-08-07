declare const escapedHtmlBrand: unique symbol;

/**
 * Fragment HTML sur pour l'interpolation : soit il ne contient aucune
 * donnee externe, soit celle-ci est passee par `escapeHtml`.
 *
 * La marque n'existe qu'a la compilation — au runtime c'est une `string`.
 * Seuls `escapeHtml` et le tag `safeHtml` la produisent : le symbole de
 * marquage n'est pas exporte, donc le type est infalsifiable au-dehors.
 */
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
