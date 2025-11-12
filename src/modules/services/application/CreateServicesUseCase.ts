import { IServicesRepository } from "../domain/IServicesRepository";

export class CreateServicesUseCase {
  constructor(private repo: IServicesRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
