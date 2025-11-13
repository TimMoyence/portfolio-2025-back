import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateContactsUseCase } from '../application/CreateContacts.useCase';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly createUseCase: CreateContactsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: any) {
    return this.createUseCase.execute(dto);
  }
}
