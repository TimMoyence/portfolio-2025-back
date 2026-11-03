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

export interface EngineCoverage {
  readonly google: EngineScore;
  readonly bingChatGpt: EngineScore;
  readonly perplexity: EngineScore;
  readonly geminiOverviews: EngineScore;
}
