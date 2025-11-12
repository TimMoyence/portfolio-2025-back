import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateContactsUseCase } from './application/CreateContactsUseCase';
import { CONTACTS_REPOSITORY } from './domain/token';
import { ContactsRepositoryTypeORM } from './infrastructure/ContactsRepositoryTypeORM';
import { ContactsEntity } from './infrastructure/entities/ContactMessage.entity';
import { ContactsController } from './interfaces/ContactsController';

const CONTACTS_USE_CASES = [CreateContactsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([ContactsEntity])],
  controllers: [ContactsController],
  providers: [
    ...CONTACTS_USE_CASES,
    {
      provide: CONTACTS_REPOSITORY,
      useClass: ContactsRepositoryTypeORM,
    },
  ],
  exports: [CONTACTS_REPOSITORY],
})
export class ContactsModule {}
