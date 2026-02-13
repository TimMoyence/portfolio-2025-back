import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AuditRequest } from '../domain/AuditRequest';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AuditRequestEntity } from './entities/AuditRequest.entity';

@Injectable()
export class AuditRequestsRepositoryTypeORM
  implements IAuditRequestsRepository
{
  constructor(
    @InjectRepository(AuditRequestEntity)
    private readonly repo: Repository<AuditRequestEntity>,
  ) {}

  async create(data: AuditRequest): Promise<AuditRequestResponse> {
    const entity = this.repo.create({
      websiteName: data.websiteName,
      contactMethod: data.contactMethod,
      contactValue: data.contactValue,
      done: data.done,
      ip: data.ip ?? undefined,
      userAgent: data.userAgent ?? undefined,
      referer: data.referer ?? undefined,
      requestId: randomUUID(),
    });

    await this.repo.save(entity);

    return {
      message: 'Audit request created successfully.',
      httpCode: 201,
    };
  }
}
