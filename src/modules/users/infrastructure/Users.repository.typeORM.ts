import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAddress } from '../../../common/domain/value-objects/EmailAddress';
import { PostgresErrorClassifier } from '../../../common/infrastructure/typeorm/PostgresErrorClassifier';
import { CompteDejaInscritError } from '../domain/CompteDejaInscritError';
import { IUsersRepository } from '../domain/IUsers.repository';
import { UsersEntity } from './entities/Users.entity';
@Injectable()
export class UsersRepositoryTypeORM
  extends PostgresErrorClassifier
  implements IUsersRepository
{
  constructor(
    @InjectRepository(UsersEntity)
    private readonly repo: Repository<UsersEntity>,
  ) {
    super();
  }
  async findAll(): Promise<UsersEntity[]> {
    return this.repo.find();
  }

  async create(data: Partial<UsersEntity>): Promise<UsersEntity> {
    return this.enregistrerSansDoublon(
      this.repo,
      this.repo.create(data),
      () => new CompteDejaInscritError(),
    );
  }

  async findById(id: string): Promise<UsersEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UsersEntity | null> {
    const adresse = EmailAddress.parse(email);
    if (adresse === null) return null;
    return this.repo.findOne({ where: { email: adresse.value } });
  }

  async findByGoogleId(googleId: string): Promise<UsersEntity | null> {
    return this.repo.findOne({ where: { googleId } });
  }

  async update(id: string, data: Partial<UsersEntity>): Promise<UsersEntity> {
    try {
      await this.repo.update({ id }, data);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }
      throw new CompteDejaInscritError();
    }
    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`User with id ${id} could not be updated`);
    }

    return updated;
  }
}
