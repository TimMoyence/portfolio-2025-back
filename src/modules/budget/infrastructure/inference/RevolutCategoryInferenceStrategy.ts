import { Injectable } from '@nestjs/common';
import type { ICategoryInferenceStrategy } from '../../domain/ICategoryInferenceStrategy';
import type { CategoryRulesConfig } from './category-rules.config';

const DIACRITICS_REGEX = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g',
);

/**
 * Adapter d'inference de categorie pour CSV Revolut.
 *
 * Implemente {@link ICategoryInferenceStrategy} en s'appuyant sur une
 * {@link CategoryRulesConfig} injectee : aucune donnee personnelle n'est
 * hardcodee. Les regles personnelles (colocataire, assureur, employeur) sont
 * fournies par configuration externe — voir `category-rules.config.ts`.
 */
@Injectable()
export class RevolutCategoryInferenceStrategy implements ICategoryInferenceStrategy {
  constructor(private readonly config: CategoryRulesConfig) {}

  infer(description: string, type: string, amount: number): string | null {
    const normalizedDesc = this.normalizeText(description);
    const normalizedType = this.normalizeText(type);

    for (const rule of this.config.rules) {
      if (!this.amountSignMatches(rule.amountSign, amount)) continue;
      const matchKeyword = rule.keywords.some((kw) =>
        normalizedDesc.includes(this.normalizeText(kw)),
      );
      if (matchKeyword) {
        return rule.categoryName;
      }
    }

    const exactCategoryMatch = this.config.rules.find(
      (rule) => this.normalizeText(rule.categoryName) === normalizedDesc,
    );
    if (exactCategoryMatch) {
      return exactCategoryMatch.categoryName;
    }

    if (
      this.config.transferPocketCategoryName !== undefined &&
      normalizedType.includes('transfer') &&
      normalizedDesc.includes('pocket')
    ) {
      return this.config.transferPocketCategoryName;
    }

    return this.config.defaultCategoryName;
  }

  private amountSignMatches(
    expected: 'positive' | 'negative' | 'any' | undefined,
    amount: number,
  ): boolean {
    if (!expected || expected === 'any') return true;
    if (expected === 'positive') return amount > 0;
    return amount < 0;
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '');
  }
}
