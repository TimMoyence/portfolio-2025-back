import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultBudgetCategories1775400000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const categories = [
      {
        name: 'Loyer',
        color: '#EF4444',
        icon: 'home',
        type: 'FIXED',
        limit: 735,
        order: 1,
      },
      {
        name: 'Electricité & Internet',
        color: '#F59E0B',
        icon: 'zap',
        type: 'VARIABLE',
        limit: 0,
        order: 2,
      },
      {
        name: 'Forfait telephone Tim & Maria',
        color: '#8B5CF6',
        icon: 'phone',
        type: 'FIXED',
        limit: 32,
        order: 3,
      },
      {
        name: 'Assur. Habitation',
        color: '#6366F1',
        icon: 'shield',
        type: 'FIXED',
        limit: 16.74,
        order: 4,
      },
      {
        name: 'Voiture forfait',
        color: '#EC4899',
        icon: 'car',
        type: 'FIXED',
        limit: 20,
        order: 5,
      },
      {
        name: 'Salle de sport',
        color: '#14B8A6',
        icon: 'dumbbell',
        type: 'FIXED',
        limit: 45,
        order: 6,
      },
      {
        name: 'Netflix & Amazon & Ororo',
        color: '#F97316',
        icon: 'tv',
        type: 'FIXED',
        limit: 31,
        order: 7,
      },
      {
        name: 'Courses',
        color: '#22C55E',
        icon: 'shopping-cart',
        type: 'VARIABLE',
        limit: 600,
        order: 8,
      },
      {
        name: 'Voiture utilisation',
        color: '#A855F7',
        icon: 'fuel',
        type: 'VARIABLE',
        limit: 50,
        order: 9,
      },
      {
        name: 'Achat pour la maison',
        color: '#0EA5E9',
        icon: 'sofa',
        type: 'VARIABLE',
        limit: 100,
        order: 10,
      },
      {
        name: 'Achat pour la beauté',
        color: '#D946EF',
        icon: 'sparkles',
        type: 'VARIABLE',
        limit: 0,
        order: 11,
      },
      {
        name: 'Luna',
        color: '#F472B6',
        icon: 'heart',
        type: 'VARIABLE',
        limit: 75,
        order: 12,
      },
      {
        name: 'Restaurant',
        color: '#FB923C',
        icon: 'utensils',
        type: 'VARIABLE',
        limit: 500,
        order: 13,
      },
      {
        name: 'Entertainment',
        color: '#34D399',
        icon: 'music',
        type: 'VARIABLE',
        limit: 50,
        order: 14,
      },
      {
        name: 'Gifts',
        color: '#C084FC',
        icon: 'gift',
        type: 'VARIABLE',
        limit: 50,
        order: 15,
      },
      {
        name: 'Autres',
        color: '#6B7280',
        icon: 'tag',
        type: 'VARIABLE',
        limit: 0,
        order: 16,
      },
      {
        name: 'Pockets',
        color: '#94A3B8',
        icon: 'wallet',
        type: 'VARIABLE',
        limit: 0,
        order: 17,
      },
      {
        name: 'Contribution',
        color: '#10B981',
        icon: 'arrow-up',
        type: 'VARIABLE',
        limit: 0,
        order: 18,
      },
      {
        name: 'Transfer / Savings',
        color: '#3B82F6',
        icon: 'piggy-bank',
        type: 'VARIABLE',
        limit: 0,
        order: 19,
      },
    ];

    for (const cat of categories) {
      await queryRunner.query(
        `INSERT INTO "budget_categories" ("group_id", "name", "color", "icon", "budget_type", "budget_limit", "display_order")
         VALUES (NULL, $1, $2, $3, $4, $5, $6)`,
        [cat.name, cat.color, cat.icon, cat.type, cat.limit, cat.order],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "budget_categories" WHERE "group_id" IS NULL;`,
    );
  }
}
