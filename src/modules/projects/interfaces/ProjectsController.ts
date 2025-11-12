import { Controller, Get, Post, Body } from "@nestjs/common";
import { CreateProjectsUseCase } from "../application/CreateProjectsUseCase";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly createUseCase: CreateProjectsUseCase) {}

  @Get()
  findAll() { return []; }

  @Post()
  create(@Body() dto: any) { return this.createUseCase.execute(dto); }
}
