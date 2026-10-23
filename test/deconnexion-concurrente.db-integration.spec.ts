import type { EntitySubscriberInterface } from 'typeorm';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { issueAuthSession } from '../src/modules/users/application/services/issue-auth-session';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { RefreshTokenEntity } from '../src/modules/users/infrastructure/entities/RefreshToken.entity';
import { UsersEntity } from '../src/modules/users/infrastructure/entities/Users.entity';
import { RefreshTokensRepositoryTypeORM } from '../src/modules/users/infrastructure/RefreshTokens.repository.typeORM';
import { UsersRepositoryTypeORM } from '../src/modules/users/infrastructure/Users.repository.typeORM';
import { buildConfigService, TEST_JWT_SECRET } from './factories/env.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  inscrireUtilisateur,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';

describeDb(
  'Deconnexion pendant un rafraichissement, sur une base migree',
  () => {
    const base = baseMigreeDeLaSuite(
      [TOUTES_LES_ENTITES],
      [TOUTES_LES_MIGRATIONS],
    );
    const jwtTokenService = new JwtTokenService(
      buildConfigService({
        JWT_SECRET: TEST_JWT_SECRET,
        JWT_EXPIRES_IN: 900,
      }),
    );

    function monter() {
      const jetons = new RefreshTokensRepositoryTypeORM(
        base().getRepository(RefreshTokenEntity),
      );
      const comptes = new UsersRepositoryTypeORM(
        base().getRepository(UsersEntity),
      );
      return {
        jetons,
        comptes,
        rafraichir: new RefreshTokensUseCase(jetons, comptes, jwtTokenService),
        deconnecter: new RevokeTokenUseCase(jetons),
      };
    }

    async function ouvrirUneSession(
      montage: ReturnType<typeof monter>,
      userId: string,
    ): Promise<string> {
      const compte = await montage.comptes.findById(userId);
      const { refreshToken } = await issueAuthSession(
        compte!,
        jwtTokenService,
        montage.jetons,
      );
      return refreshToken;
    }

    function pointDArret() {
      let signaler: () => void = () => undefined;
      let liberer: () => void = () => undefined;
      const atteint = new Promise<void>((resolve) => (signaler = resolve));
      const reprise = new Promise<void>((resolve) => (liberer = resolve));
      return {
        atteint,
        liberer: () => liberer(),
        marquer: async () => {
          signaler();
          await reprise;
        },
      };
    }

    function suspendreApresLaRotation(montage: ReturnType<typeof monter>) {
      const lireLeCompte = montage.comptes.findById.bind(montage.comptes);
      const arret = pointDArret();
      jest
        .spyOn(montage.comptes, 'findById')
        .mockImplementationOnce(async (id) => {
          await arret.marquer();
          return lireLeCompte(id);
        });
      return arret;
    }

    function suspendreAvantLEnregistrementDuSuivant() {
      const arret = pointDArret();
      let suspendu = false;
      const abonne: EntitySubscriberInterface<RefreshTokenEntity> = {
        listenTo: () => RefreshTokenEntity,
        beforeInsert: async () => {
          if (suspendu) return;
          suspendu = true;
          await arret.marquer();
        },
      };
      base().subscribers.push(abonne);
      return {
        ...arret,
        retirer: () => {
          base().subscribers.splice(base().subscribers.indexOf(abonne), 1);
        },
      };
    }

    async function uneAttenteDeVerrou(): Promise<void> {
      for (let tour = 0; tour < 250; tour += 1) {
        const [{ enAttente }]: { enAttente: number }[] = await base().query(
          `SELECT count(*)::int AS "enAttente" FROM pg_stat_activity
         WHERE "datname" = current_database() AND "wait_event_type" = 'Lock'
           AND "pid" <> pg_backend_pid()`,
        );
        if (enAttente > 0) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }

    async function jetonsActifs(userId: string): Promise<number> {
      const [{ actifs }]: { actifs: number }[] = await base().query(
        `SELECT count(*)::int AS "actifs" FROM "refresh_tokens"
       WHERE "user_id" = $1 AND "revoked" = false`,
        [userId],
      );
      return actifs;
    }

    async function deconnecterPendantLeRafraichissement(
      email: string,
      jetonDeconnecte: (jetonRafraichi: string, autre: string) => string,
    ) {
      const userId = await inscrireUtilisateur(base(), email);
      const montage = monter();
      const jetonRafraichi = await ouvrirUneSession(montage, userId);
      const autre = await ouvrirUneSession(montage, userId);
      const rotation = suspendreApresLaRotation(montage);

      const issue = montage.rafraichir.execute(jetonRafraichi).then(
        () => 'session emise',
        (erreur: Error) => erreur.name,
      );
      await rotation.atteint;
      await montage.deconnecter.execute(jetonDeconnecte(jetonRafraichi, autre));
      rotation.liberer();

      return { issue: await issue, actifs: await jetonsActifs(userId) };
    }

    it('n emet aucune session quand la deconnexion du meme poste tombe entre la rotation et l emission', async () => {
      expect(
        await deconnecterPendantLeRafraichissement(
          'meme-poste@example.com',
          (jetonRafraichi) => jetonRafraichi,
        ),
      ).toEqual({ issue: 'InvalidCredentialsError', actifs: 0 });
    });

    it('n emet aucune session quand la deconnexion d un autre poste du compte tombe entre la rotation et l emission', async () => {
      expect(
        await deconnecterPendantLeRafraichissement(
          'autre-poste@example.com',
          (_jetonRafraichi, autre) => autre,
        ),
      ).toEqual({ issue: 'InvalidCredentialsError', actifs: 0 });
    });

    it('ne laisse aucun jeton actif quand la deconnexion tombe entre la verification du precedent et l enregistrement du suivant', async () => {
      const userId = await inscrireUtilisateur(
        base(),
        'pendant-l-enregistrement@example.com',
      );
      const montage = monter();
      const jeton = await ouvrirUneSession(montage, userId);
      const enregistrement = suspendreAvantLEnregistrementDuSuivant();

      const rafraichissement = montage.rafraichir.execute(jeton);
      await enregistrement.atteint;
      const deconnexion = montage.deconnecter.execute(jeton);
      await Promise.race([deconnexion, uneAttenteDeVerrou()]);
      enregistrement.liberer();
      await Promise.allSettled([rafraichissement, deconnexion]);
      enregistrement.retirer();

      expect(await jetonsActifs(userId)).toBe(0);
    });
  },
);
