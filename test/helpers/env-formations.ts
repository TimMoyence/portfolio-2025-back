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

export function installerSecretDeJalons(
  secret = 'secret-de-test-des-jalons-assez-long-1234',
): void {
  let secretInitial: string | undefined;

  beforeAll(() => {
    secretInitial = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATIONS_PULSE_SECRET = secret;
  });

  afterAll(() => {
    process.env.FORMATIONS_PULSE_SECRET = secretInitial;
  });
}
