import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateContactsUseCase } from './application/CreateContacts.useCase';
import { CONTACTS_REPOSITORY } from './domain/token';
import { ContactsRepositoryTypeORM } from './infrastructure/Contacts.repository.typeORM';
import { ContactMessagesEntity } from './infrastructure/entities/ContactMessage.entity';
import { ContactsController } from './interfaces/Contacts.controller';

const CONTACTS_USE_CASES = [CreateContactsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessagesEntity])],
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
