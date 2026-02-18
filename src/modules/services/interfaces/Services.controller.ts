import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateServicesUseCase } from '../application/CreateServices.useCase';
import { Services } from '../domain/Services';

@Controller('services')
export class ServicesController {
  constructor(private readonly createUseCase: CreateServicesUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: Services) {
    return this.createUseCase.execute(dto);
  }
}
