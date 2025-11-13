import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRedirectsUseCase } from '../application/CreateRedirects.useCase';

@Controller('redirects')
export class RedirectsController {
  constructor(private readonly createUseCase: CreateRedirectsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: any) {
    return this.createUseCase.execute(dto);
  }
}
