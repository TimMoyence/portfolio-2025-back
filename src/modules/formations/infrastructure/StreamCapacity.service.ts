import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { type RedisOptions } from 'ioredis';
import { envInt, envString } from '../../../config/env-readers.util';
import type {
  IStreamCapacity,
  StreamCapacityLease,
  StreamCapacityRequest,
} from '../domain/IStreamCapacity.port';

const PREFIX = '{formations:stream}:capacity:';
const LEASE_TTL_MS = 30_000;
const MAX_RETRIES = 3;

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
  private redisErrors = 0;
  private connexion: Promise<Redis> | null = null;

  constructor() {
    const url = envString('REDIS_URL');
    const host = envString('REDIS_HOST');
    const port = envString('REDIS_PORT');
    if (url) {
      this.redis = new Redis(url, this.options());
    } else if (host && port) {
      this.redis = new Redis({
        ...this.options(),
        host,
        port: Math.max(1, envInt('REDIS_PORT', 6379)),
        username: envString('REDIS_USERNAME'),
        password: envString('REDIS_PASSWORD'),
      });
    } else {
      this.redis = null;
    }
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
      return Promise.reject(
        new Error('Plafond de flux atteint sur une autre instance.'),
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

  private options(): RedisOptions {
    return {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) =>
        times > MAX_RETRIES ? null : Math.min(times * 500, 3000),
    };
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
      this.redisErrors += 1;
      if (this.redisErrors <= MAX_RETRIES) {
        this.logger.warn(
          `Redis indisponible pour le plafond de flux: ${String(error)}`,
        );
      }
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
