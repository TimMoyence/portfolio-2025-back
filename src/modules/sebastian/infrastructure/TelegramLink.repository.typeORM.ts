import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramLink } from '../domain/TelegramLink';
import type { ITelegramLinkRepository } from '../domain/ITelegramLink.repository';
import { TelegramLinkEntity } from './entities/TelegramLink.entity';

/** Implementation TypeORM du port de persistance des liens Telegram. */
@Injectable()
export class TelegramLinkRepositoryTypeORM implements ITelegramLinkRepository {
  constructor(
    @InjectRepository(TelegramLinkEntity)
    private readonly repo: Repository<TelegramLinkEntity>,
  ) {}

  async create(data: TelegramLink): Promise<TelegramLink> {
    const entity = await this.repo.save({
      telegramUserId: String(data.telegramUserId),
      userId: data.userId,
    } as Partial<TelegramLinkEntity>);
    return this.toDomain(entity);
  }

  async findByTelegramUserId(
    telegramUserId: number,
  ): Promise<TelegramLink | null> {
    const entity = await this.repo.findOne({
      where: { telegramUserId: String(telegramUserId) },
    });
    return this.toDomainOrNull(entity);
  }

  async findByUserId(userId: string): Promise<TelegramLink | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    return this.toDomainOrNull(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: TelegramLinkEntity): TelegramLink {
    return TelegramLink.fromPersistence({
      id: entity.id,
      telegramUserId: Number(entity.telegramUserId),
      userId: entity.userId,
      linkedAt: entity.linkedAt,
    });
  }

  private toDomainOrNull(
    entity: TelegramLinkEntity | null,
  ): TelegramLink | null {
    if (!entity) return null;
    return this.toDomain(entity);
  }
}
