import { IRedirectsRepository } from "../domain/IRedirectsRepository";

export class CreateRedirectsUseCase {
  constructor(private repo: IRedirectsRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
