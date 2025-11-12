import { Controller, Get, Post, Body } from "@nestjs/common";
import { CreateServicesUseCase } from "../application/CreateServicesUseCase";

@Controller("services")
export class ServicesController {
  constructor(private readonly createUseCase: CreateServicesUseCase) {}

  @Get()
  findAll() { return []; }

  @Post()
  create(@Body() dto: any) { return this.createUseCase.execute(dto); }
}
