import { IUsersRepository } from "../domain/IUsersRepository";

export class CreateUsersUseCase {
  constructor(private repo: IUsersRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
