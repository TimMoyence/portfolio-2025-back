import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateServicesUseCase } from '../application/CreateServices.useCase';

@Controller('services')
export class ServicesController {
  constructor(private readonly createUseCase: CreateServicesUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: any) {
    return this.createUseCase.execute(dto);
  }
}
