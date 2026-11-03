import { Column, CreateDateColumn } from 'typeorm';

export const ColonneDeCreation = (): PropertyDecorator =>
  CreateDateColumn({ name: 'created_at' });

export const ColonneDeMiseAJour = (): PropertyDecorator =>
  Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  });

export abstract class ColonnesDeTrace {
  @ColonneDeCreation()
  createdAt: Date;

  @ColonneDeMiseAJour()
  updatedAt: Date;

  @Column({
    name: 'updated_or_created_by',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  updatedOrCreatedBy: string | null;
}
