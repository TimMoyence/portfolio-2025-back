export interface StructuredDataQualityResult {
  readonly score: number;
  readonly total: number;
  readonly types: ReadonlyArray<string>;
  readonly googleRichResultsEligible: boolean;
  readonly aiFriendly: boolean;
  readonly invalidBlocks: ReadonlyArray<{
    readonly type: string;
    readonly missingFields: ReadonlyArray<string>;
  }>;
}
