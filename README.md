## Docker & Compose

- Build image: `docker build -t ghcr.io/<owner>/portfolio-2025-back:dev .`
- Run locally: `docker run --rm -p 3000:3000 --env-file deploy/backend.env.example ghcr.io/<owner>/portfolio-2025-back:dev`.
- Production stack: copy `deploy/.env.example` to `deploy/.env` and `deploy/backend.env.example` to `deploy/backend.env`, then `docker compose -f deploy/compose.yaml up -d`. Postgres data is persisted in the `db_data` volume.

## CI/CD (GitHub Actions)

- Workflow `.github/workflows/ci.yml` builds with pnpm and pushes images to GHCR on `main` using tags `latest` and the commit SHA.
- Deploy step (optional) pulls the freshly built image over SSH and restarts only the `api` service via `docker compose`, ensuring only the build output is promoted.
- Required secrets for deploy: `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_REGISTRY_USER`, `DEPLOY_REGISTRY_TOKEN`. Optional: `DEPLOY_PATH` (default `/opt/portfolio-2025`), `DEPLOY_COMPOSE_FILE` (default `/opt/portfolio-2025/compose.yaml`).

commande to add new migration :

```bash
npm run migration:new --name=TheNameInCamelCase
```

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## API documentation

Swagger UI is available once the server is running:

1. Start the API (for example `pnpm run start:dev`).
2. Open `http://localhost:3000/docs` (or `/${SWAGGER_PATH}` if you override the path) to explore the automatically generated OpenAPI specification.

The documentation is backed by DTO metadata, so request/response shapes always stay in sync with the codebase.

### Auth & Users

- `POST /auth/login` — authenticate with email/password and receive a JWT plus the sanitized user payload.
- `PATCH /auth/change-password` — change a user's password by providing the current and new password (hashed transparently before persisting).
- `GET /users` & CRUD routes — manage users; all responses omit sensitive hashes.

### Audit SSE flow

- `POST /audits` (and legacy `POST /audit-requests`) — create an audit request and enqueue async processing.
- `GET /audits/:id/stream` — Server-Sent Events stream (`progress`, `completed`, `failed`, `heartbeat`).
- `GET /audits/:id/summary` — recovery endpoint for the persisted user summary.

Main env keys for this flow:

- `AUDIT_QUEUE_ENABLED`, `AUDIT_QUEUE_NAME`, `REDIS_URL` (or `REDIS_HOST` + `REDIS_PORT`).
- `AUDIT_FETCH_TIMEOUT_MS`, `AUDIT_MAX_REDIRECTS`, `AUDIT_HTML_MAX_BYTES`, `AUDIT_TEXT_MAX_BYTES`.
- `AUDIT_SITEMAP_SAMPLE_SIZE`, `AUDIT_SITEMAP_MAX_URLS`, `AUDIT_SITEMAP_ANALYZE_LIMIT`, `AUDIT_PAGE_AI_CIRCUIT_BREAKER_MIN_SAMPLES`, `AUDIT_PAGE_AI_CIRCUIT_BREAKER_FAILURE_RATIO`.
- `OPENAI_API_KEY`, `AUDIT_LLM_MODEL`, `AUDIT_LLM_TIMEOUT_MS`, `AUDIT_LLM_SUMMARY_TIMEOUT_MS`, `AUDIT_LLM_EXPERT_TIMEOUT_MS`, `AUDIT_LLM_PROFILE`, `AUDIT_LLM_PROFILE_CANARY_PERCENT`, `AUDIT_LLM_GLOBAL_TIMEOUT_MS`, `AUDIT_LLM_SECTION_TIMEOUT_MS`, `AUDIT_LLM_SECTION_RETRY_MAX`, `AUDIT_LLM_SECTION_RETRY_MIN_REMAINING_MS`, `AUDIT_LLM_INFLIGHT_MAX`, `AUDIT_LLM_RETRIES`, `AUDIT_LLM_LANGUAGE`.
- `AUDIT_REPORT_TO` (fallbacks to `CONTACT_NOTIFICATION_TO`).

LLM rollout notes:

- Use `AUDIT_LLM_PROFILE=parallel_sections_v1` for map/reduce fan-out synthesis.
- Use `AUDIT_LLM_PROFILE_CANARY_PERCENT` (0..100) for deterministic canary rollout by `auditId`.
- `AUDIT_LLM_GLOBAL_TIMEOUT_MS` is a hard wall-clock budget for the synthesis stage.

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

Create a migrate service in deploy folder to run migrations on deployment server

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

```

```
