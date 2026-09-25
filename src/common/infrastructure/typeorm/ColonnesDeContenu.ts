import { Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ColonnesDeTrace } from './ColonnesDeTrace';

export abstract class ContenuASlugUnique extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;
}

export const ColonneLocale = (): PropertyDecorator => Column({ type: 'text' });

export function SlugDeTraduction(): PropertyDecorator {
  return (cible, propriete) => {
    Column({ type: 'text' })(cible, propriete);
    Index()(cible, propriete);
  };
}

export abstract class TraductionDeContenu extends ColonnesDeTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ColonneLocale()
  locale: string;

  @SlugDeTraduction()
  slug: string;
}
