/**
 * Résultat de l'analyse qualité d'un ensemble de blocs JSON-LD extraits
 * d'une page. Utilisé par le pipeline d'audit pour évaluer l'éligibilité
 * aux Rich Results Google et la facilité d'exploitation par les IA.
 */
export interface StructuredDataQualityResult {
  /** Score de qualité global, borné entre 0 et 100. */
  readonly score: number;
  /** Nombre total de blocs JSON-LD analysés. */
  readonly total: number;
  /** Types schema.org détectés. */
  readonly types: ReadonlyArray<string>;
  /** Vrai si au moins un bloc est éligible aux Google Rich Results. */
  readonly googleRichResultsEligible: boolean;
  /** Vrai si au moins un bloc est de type considéré AI-friendly. */
  readonly aiFriendly: boolean;
  /** Blocs invalides (champs obligatoires manquants) détectés. */
  readonly invalidBlocks: ReadonlyArray<{
    readonly type: string;
    readonly missingFields: ReadonlyArray<string>;
  }>;
}
