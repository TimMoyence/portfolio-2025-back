import { Column } from 'typeorm';
import type { SupportedLocale } from '../../../domain/value-objects/LocaleCode';

export const ColonneDeLangue = (defaut?: SupportedLocale): PropertyDecorator =>
  Column({
    type: 'varchar',
    length: 2,
    ...(defaut === undefined ? {} : { default: defaut }),
  });
