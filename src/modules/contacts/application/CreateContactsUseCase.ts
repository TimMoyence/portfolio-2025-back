import { IContactsRepository } from "../domain/IContactsRepository";

export class CreateContactsUseCase {
  constructor(private repo: IContactsRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
