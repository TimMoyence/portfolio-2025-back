import { Inject, Injectable, Logger } from '@nestjs/common';
import { aHeureFixe } from '../../../common/application/plancher-de-latence';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import type { RequestPasswordResetCommand } from './dto/RequestPasswordReset.command';
import { EnvoiDeReinitialisation } from './services/password-reset-dispatch';

export interface RequestPasswordResetResult {
  message: string;
}

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);
  private readonly genericMessage =
    'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.';

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly envoiDeReinitialisation: EnvoiDeReinitialisation,
  ) {}

  execute(
    dto: RequestPasswordResetCommand,
  ): Promise<RequestPasswordResetResult> {
    return aHeureFixe(
      () => this.demander(dto),
      { message: this.genericMessage },
      'Password reset request failed',
      this.logger,
    );
  }

  private async demander(
    dto: RequestPasswordResetCommand,
  ): Promise<RequestPasswordResetResult> {
    await this.envoiDeReinitialisation.envoyer(
      await this.usersRepository.findByEmail(dto.email),
      'demande',
      this.logger,
    );

    return { message: this.genericMessage };
  }
}
