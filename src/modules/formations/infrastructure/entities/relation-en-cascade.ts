import { JoinColumn, ManyToOne } from 'typeorm';

export function relationEnCascade(
  cible: () => new () => object,
  colonne: string,
  contrainte: string,
): PropertyDecorator {
  const relation = ManyToOne(cible, { onDelete: 'CASCADE' });
  const jointure = JoinColumn({
    name: colonne,
    foreignKeyConstraintName: contrainte,
  });
  return (prototype, propriete) => {
    relation(prototype, propriete);
    jointure(prototype, propriete);
  };
}
