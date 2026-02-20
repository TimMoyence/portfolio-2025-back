import { Inject, Injectable } from '@nestjs/common';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import { Redirects } from '../domain/Redirects';
import { REDIRECTS_REPOSITORY } from '../domain/token';
import { CreateRedirectCommand } from './dto/CreateRedirect.command';
import { RedirectMapper } from './mappers/Redirect.mapper';

@Injectable()
export class CreateRedirectsUseCase {
  constructor(
    @Inject(REDIRECTS_REPOSITORY)
    private repo: IRedirectsRepository,
  ) {}

  async execute(data: CreateRedirectCommand): Promise<Redirects> {
    const redirect = RedirectMapper.fromCreateCommand(data);
    return this.repo.create(redirect);
  }
}
