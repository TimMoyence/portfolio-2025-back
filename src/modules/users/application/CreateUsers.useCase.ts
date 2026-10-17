import { Inject, Injectable, Logger } from '@nestjs/common';
import { avecUnPlancherDeLatence } from '../../../common/application/plancher-de-latence';
import { CompteDejaInscritError } from '../domain/CompteDejaInscritError';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type {
  CreateUserCommand,
  CreateUserResult,
  InscriptionCommand,
  InscriptionResult,
} from './dto/CreateUser.command';
import { UsersMapper } from './mappers/UsersMapper';
import { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';
import { EnvoiDeReinitialisation } from './services/password-reset-dispatch';
import { PasswordService } from './services/PasswordService';

const INSCRIPTION_ENREGISTREE: InscriptionResult = {
  message:
    'Inscription reussie. Un email de verification a ete envoye a votre adresse.',
};

@Injectable()
export class CreateUsersUseCase {
  private readonly logger = new Logger(CreateUsersUseCase.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private repo: IUsersRepository,
    private readonly envoiDeVerification: EnvoiDeVerificationEmail,
    private readonly passwordService: PasswordService,
    private readonly envoiDeReinitialisation: EnvoiDeReinitialisation,
  ) {}

  inscrire(dto: InscriptionCommand): Promise<InscriptionResult> {
    return avecUnPlancherDeLatence(() => this.enregistrerLInscription(dto));
  }

  private async enregistrerLInscription(
    dto: InscriptionCommand,
  ): Promise<InscriptionResult> {
    try {
      await this.execute({ ...dto, updatedOrCreatedBy: 'self-registration' });
    } catch (erreur) {
      if (!(erreur instanceof CompteDejaInscritError)) {
        throw erreur;
      }
      await this.envoiDeReinitialisation.envoyer(
        await this.repo.findByEmail(dto.email),
        'tentative-d-inscription',
        this.logger,
      );
    }
    return INSCRIPTION_ENREGISTREE;
  }

  async execute(dto: CreateUserCommand): Promise<CreateUserResult> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const isSelfRegistration = dto.updatedOrCreatedBy === 'self-registration';

    const imposeALInscriptionPublique = isSelfRegistration
      ? { roles: [], isActive: true }
      : {};

    const user = UsersMapper.fromCreateCommand(
      { ...dto, ...imposeALInscriptionPublique },
      passwordHash,
    );
    const created = await this.repo.create(user);

    if (isSelfRegistration && created.id) {
      await this.envoiDeVerification.envoyer(
        created,
        created.id,
        this.logger,
        'Email verification send failed',
      );
    }

    return { user: created };
  }
}
