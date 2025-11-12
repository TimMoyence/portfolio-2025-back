import { IProjectsRepository } from "../domain/IProjectsRepository";

export class CreateProjectsUseCase {
  constructor(private repo: IProjectsRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
