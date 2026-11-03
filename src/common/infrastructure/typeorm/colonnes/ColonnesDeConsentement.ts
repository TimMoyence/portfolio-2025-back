import { Column } from 'typeorm';

export const ColonneVersionDesConditions = (): PropertyDecorator =>
  Column({ name: 'terms_version', type: 'varchar', length: 50 });

export const ColonneAcceptationDesConditions = (): PropertyDecorator =>
  Column({ name: 'terms_accepted_at', type: 'timestamptz' });
