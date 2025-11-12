import { Projects } from "./Projects";


  
    export interface IProjectsRepository {
  findAll(): Promise<Projects[]>;
  create(data: Projects): Promise<Projects>;
}
