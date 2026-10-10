import {
  createMockAuthAuditLogger,
  createMockUseCase,
} from '../../../../../test/factories/user.factory';
import type { CreateUsersUseCase } from '../../application/CreateUsers.useCase';
import { AuthController } from '../Auth.controller';
import type { CreateUserDto } from '../dto/CreateUser.dto';

const INTRUDER_CREDENTIAL = 'Motdepasse123!';

describe('AuthController — inscription publique', () => {
  it("declare self-registration, quel que soit l'auteur envoye dans le corps", async () => {
    const creation = createMockUseCase<CreateUsersUseCase>({
      resolves: { user: {} },
    });
    const unused = {} as never;
    const controller = new AuthController(
      unused,
      unused,
      creation,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      createMockAuthAuditLogger(),
    );
    const corps: CreateUserDto = {
      email: 'intrus@example.com',
      password: INTRUDER_CREDENTIAL,
      firstName: 'In',
      lastName: 'Trus',
      roles: ['admin'],
      isActive: false,
      updatedOrCreatedBy: 'admin-forge',
    };

    await controller.register(corps);

    expect(creation.execute.mock.calls).toEqual([
      [{ ...corps, updatedOrCreatedBy: 'self-registration' }],
    ]);
  });
});
