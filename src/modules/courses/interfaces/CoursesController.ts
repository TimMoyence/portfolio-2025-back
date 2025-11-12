import { Controller, Get, Post, Body } from "@nestjs/common";
import { CreateCoursesUseCase } from "../application/CreateCoursesUseCase";

@Controller("courses")
export class CoursesController {
  constructor(private readonly createUseCase: CreateCoursesUseCase) {}

  @Get()
  findAll() { return []; }

  @Post()
  create(@Body() dto: any) { return this.createUseCase.execute(dto); }
}
