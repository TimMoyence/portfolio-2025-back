import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRedirectsUseCase } from '../application/CreateRedirects.useCase';
import { Redirects } from '../domain/Redirects';

@Controller('redirects')
export class RedirectsController {
  constructor(private readonly createUseCase: CreateRedirectsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: Redirects) {
    return this.createUseCase.execute(dto);
  }
}
