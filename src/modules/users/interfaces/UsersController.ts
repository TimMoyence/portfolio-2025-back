import { Controller, Get, Post, Body } from "@nestjs/common";
import { CreateUsersUseCase } from "../application/CreateUsersUseCase";

@Controller("users")
export class UsersController {
  constructor(private readonly createUseCase: CreateUsersUseCase) {}

  @Get()
  findAll() { return []; }

  @Post()
  create(@Body() dto: any) { return this.createUseCase.execute(dto); }
}
