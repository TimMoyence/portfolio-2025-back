/**
 * Seuils numeriques centralises pour l'analyse deep-url (scoring Growth
 * Audit). Extrait des god-objects `DeepUrlAnalysisService` (ex-1154L) et
 * `ReportQualityGateService` pour rendre les regles observables, tunables
 * (via env var futur) et testables en isolation.
 *
 * Les valeurs par defaut reflettent la pratique SEO 2026 :
 *  - Titles 20-65 caracteres (ex-recommandation Google SERP)
 *  - Meta descriptions 80-170 caracteres
 *  - Content depth : <120 mots = tres mince, <260 = mince, <900 = normal,
 *    sinon riche (seuils bases sur l'heuristique Ahrefs/SEMrush)
 *  - Ratio severity : 50%+ = high, 20%+ = medium, sinon low
 *  - Internal links : 0 = none, 1-2 = weak, 3+ = strong
 *  - Template duplicates : 3+ URLs partageant le meme pattern = duplicate
 *  - Affected URLs max : 30 references par finding (limite UI + payload LLM)
 */

/** Seuils de longueur titles (caracteres). */
export const TITLE_LENGTH_MIN = 20;
export const TITLE_LENGTH_MAX = 65;

/** Seuils de longueur meta descriptions (caracteres). */
export const META_LENGTH_MIN = 80;
export const META_LENGTH_MAX = 170;

/** Seuils de profondeur de contenu (mots). */
export const CONTENT_DEPTH_VERY_THIN = 120;
export const CONTENT_DEPTH_THIN = 260;
export const CONTENT_DEPTH_NORMAL = 900;

/** Seuils de classification des liens internes (nombre). */
export const INTERNAL_LINKS_WEAK_MAX = 3;

/** Ratios de severite d'une finding (proportion urls affectees / total). */
export const SEVERITY_RATIO_HIGH = 0.5;
export const SEVERITY_RATIO_MEDIUM = 0.2;

/** Nombre minimum d'URLs partageant un template pour trigger un finding. */
export const TEMPLATE_DUPLICATE_MIN = 3;

/** Nombre maximum d'URLs references dans affectedUrls d'une finding. */
export const AFFECTED_URLS_MAX = 30;
