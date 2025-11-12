import { Courses } from "./Courses";


  
    export interface ICoursesRepository {
  findAll(): Promise<Courses[]>;
  create(data: Courses): Promise<Courses>;
}
