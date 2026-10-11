import { JetonDeLien } from './regles-de-saisie';

export class VerifyEmailQueryDto {
  @JetonDeLien()
  token: string;
}
