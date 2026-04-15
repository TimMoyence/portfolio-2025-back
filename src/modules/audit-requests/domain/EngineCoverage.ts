/**
 * Score d'indexabilité pour un moteur donné (Google, Bing/ChatGPT,
 * Perplexity, Gemini Overviews). Exprime les forces, les blocages et
 * les opportunités d'amélioration.
 */
export interface EngineScore {
  readonly engine:
    | 'google'
    | 'bing_chatgpt'
    | 'perplexity'
    | 'gemini_overviews';
  readonly score: number;
  readonly indexable: boolean;
  readonly strengths: ReadonlyArray<string>;
  readonly blockers: ReadonlyArray<string>;
  readonly opportunities: ReadonlyArray<string>;
}

/**
 * Couverture agrégée par moteur pour l'ensemble du site audité.
 * Chaque champ représente un moteur distinct avec son propre score.
 */
export interface EngineCoverage {
  readonly google: EngineScore;
  readonly bingChatGpt: EngineScore;
  readonly perplexity: EngineScore;
  readonly geminiOverviews: EngineScore;
}
