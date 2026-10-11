import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  journalDErreursRedis,
  optionsRedis,
  resoudreConnexionRedis,
} from '../../../common/infrastructure/redis/connexion-redis';
import { PlafondDeFluxAtteintError } from '../domain/errors/FormationErrors';
import type {
  IStreamCapacity,
  StreamCapacityLease,
  StreamCapacityRequest,
} from '../domain/IStreamCapacity.port';

const PREFIX = '{formations:stream}:capacity:';
const LEASE_TTL_MS = 30_000;

const ACQUIRE_SCRIPT = `
local now = tonumber(ARGV[1])
local expires = tonumber(ARGV[2])
local token = ARGV[3]
local ttl = tonumber(ARGV[4])
for index = 1, #KEYS do
  redis.call('ZREMRANGEBYSCORE', KEYS[index], '-inf', now)
  if redis.call('ZCARD', KEYS[index]) >= tonumber(ARGV[4 + index]) then
    return 0
  end
end
for index = 1, #KEYS do
  redis.call('ZADD', KEYS[index], expires, token)
  redis.call('PEXPIRE', KEYS[index], ttl + 1000)
end
return 1
`;

const REFRESH_SCRIPT = `
local expires = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local token = ARGV[3]
for index = 1, #KEYS do
  if redis.call('ZSCORE', KEYS[index], token) then
    redis.call('ZADD', KEYS[index], expires, token)
    redis.call('PEXPIRE', KEYS[index], ttl + 1000)
  end
end
return 1
`;

const RELEASE_SCRIPT = `
local token = ARGV[1]
for index = 1, #KEYS do
  redis.call('ZREM', KEYS[index], token)
  if redis.call('ZCARD', KEYS[index]) == 0 then
    redis.call('DEL', KEYS[index])
  end
end
return 1
`;

@Injectable()
export class StreamCapacityService implements IStreamCapacity, OnModuleDestroy {
  private readonly logger = new Logger(StreamCapacityService.name);
  private readonly redis: Redis | null;
  private connexion: Promise<Redis> | null = null;
  private readonly signalerErreur = journalDErreursRedis({
    libelle: 'Redis indisponible pour le plafond de flux',
    avertir: (message) => this.logger.warn(message),
  });

  constructor() {
    const connexion = resoudreConnexionRedis();
    this.redis =
      connexion === undefined
        ? null
        : new Redis(
            optionsRedis(connexion, {
              lazyConnect: true,
              enableOfflineQueue: false,
              maxRetriesPerRequest: 1,
            }),
          );
  }

  async acquire(
    request: StreamCapacityRequest,
  ): Promise<StreamCapacityLease | null> {
    if (this.redis === null) {
      return null;
    }
    const token = `${process.pid}:${Date.now()}:${randomUUID()}`;
    const keys = request.places.map(({ key }) => `${PREFIX}${key}`);
    const now = Date.now();
    const result = await this.eval(ACQUIRE_SCRIPT, keys, [
      now,
      now + LEASE_TTL_MS,
      token,
      LEASE_TTL_MS,
      ...request.places.map(({ limit }) => limit),
    ]);
    if (result !== 1) {
      throw new PlafondDeFluxAtteintError(
        request.places.map(({ key }) => key).join(', '),
      );
    }
    return { token, keys };
  }

  async refresh(lease: StreamCapacityLease): Promise<void> {
    if (this.redis === null) {
      return;
    }
    await this.eval(REFRESH_SCRIPT, lease.keys, [
      Date.now() + LEASE_TTL_MS,
      LEASE_TTL_MS,
      lease.token,
    ]);
  }

  async release(lease: StreamCapacityLease): Promise<void> {
    if (this.redis === null) {
      return;
    }
    await this.eval(RELEASE_SCRIPT, lease.keys, [lease.token]);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis !== null) {
      await this.redis.quit();
    }
  }

  private async client(): Promise<Redis> {
    if (this.redis === null) {
      throw new Error('Redis n’est pas configuré pour le plafond de flux.');
    }
    if (this.redis.status === 'ready') {
      return this.redis;
    }
    if (this.connexion === null) {
      this.connexion = this.redis.connect().then(() => this.redis as Redis);
    }
    try {
      return await this.connexion;
    } catch (error) {
      this.connexion = null;
      this.signalerErreur(error);
      throw error;
    }
  }

  private async eval(
    script: string,
    keys: readonly string[],
    args: readonly (number | string)[],
  ): Promise<number> {
    const client = await this.client();
    return Number(
      await client.eval(script, keys.length, ...keys, ...args.map(String)),
    );
  }
}
