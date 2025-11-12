import { Controller, Get, Post, Body } from "@nestjs/common";
import { CreateContactsUseCase } from "../application/CreateContactsUseCase";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly createUseCase: CreateContactsUseCase) {}

  @Get()
  findAll() { return []; }

  @Post()
  create(@Body() dto: any) { return this.createUseCase.execute(dto); }
}
