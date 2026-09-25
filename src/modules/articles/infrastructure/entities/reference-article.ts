import { Column, ForeignKey } from 'typeorm';
import type { OnDeleteType } from 'typeorm/metadata/types/OnDeleteType';
import { ArticleEntity } from './article.entity';

export function ReferenceArticle(
  nom: string,
  onDelete: OnDeleteType,
): PropertyDecorator {
  return (cible, propriete) => {
    Column({ type: 'uuid' })(cible, propriete);
    ForeignKey(() => ArticleEntity, { name: nom, onDelete })(cible, propriete);
  };
}
