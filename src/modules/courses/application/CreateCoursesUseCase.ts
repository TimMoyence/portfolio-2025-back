import { ICoursesRepository } from "../domain/ICoursesRepository";

export class CreateCoursesUseCase {
  constructor(private repo: ICoursesRepository) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
