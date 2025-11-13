import { Inject } from '@nestjs/common';
import type { IContactsRepository } from '../domain/IContacts.repository';
import { CONTACTS_REPOSITORY } from '../domain/token';

export class CreateContactsUseCase {
  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private repo: IContactsRepository,
  ) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
