export interface EnvFormations {
  readonly secret: string;
  readonly syntheseA: string;
}

export function installerEnvFormations(env: EnvFormations): void {
  beforeAll(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = env.secret;
    process.env.FORMATIONS_PULSE_SECRET = env.secret;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = env.syntheseA;
  });

  afterAll(() => {
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    delete process.env.FORMATIONS_PULSE_SECRET;
    delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
  });
}
