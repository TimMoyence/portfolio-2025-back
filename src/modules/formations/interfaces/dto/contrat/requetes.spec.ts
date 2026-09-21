import { BadRequestException } from '@nestjs/common';
import { validateBody } from '../../../../../../test/helpers/validation-pipe';
import { ControlSessionRequestDto } from './control-session.request.dto';
import { DeclarerJalonRequestDto } from './declarer-jalon.request.dto';
import { OpenSessionRequestDto } from './open-session.request.dto';
import { SubmitDefiRequestDto } from './submit-defi.request.dto';
import { SubmitProductionRequestDto } from './submit-production.request.dto';
import { TenterEnigmeRequestDto } from './tenter-enigme.request.dto';

const DUREE_MS = 42000;
const QUESTION_FEUILLE = 'b2-01-a4-feuille-canaux';

function production(valeur: unknown): Record<string, unknown> {
  return { questionId: QUESTION_FEUILLE, valeur, dureeMs: DUREE_MS };
}

describe('DTO de requête du contrat V3 (§ 9.5, sans route active)', () => {
  describe('POST sessions/:id/productions', () => {
    it.each([
      ['une feuille', { type: 'feuille', cellules: { E2: '=C2/$C$5' } }],
      [
        'un tableau',
        { type: 'tableau', saisies: [{ rang: 0, cle: 'prix', valeur: 21.6 }] },
      ],
      [
        'un classement',
        {
          type: 'classement',
          classement: { 'carte-ca-2024-2025': 'comparable' },
        },
      ],
      ['« je ne sais pas »', { type: 'classement', neSaitPas: true }],
    ])('accepte %s', async (_forme, valeur) => {
      const dto = await validateBody(
        production(valeur),
        SubmitProductionRequestDto,
      );

      expect(dto.valeur).toEqual(valeur);
    });

    it.each([
      ['un type inconnu', { type: 'graphique', cellules: {} }],
      ['« je ne sais pas » à faux', { type: 'feuille', neSaitPas: false }],
      [
        'une clé hors contrat',
        { type: 'feuille', cellules: { E2: '=1' }, note: 20 },
      ],
      [
        'une formule de plus de 200 caractères',
        { type: 'feuille', cellules: { E2: `=${'1+'.repeat(100)}1` } },
      ],
      ['une cellule non textuelle', { type: 'feuille', cellules: { E2: 3 } }],
      [
        'une saisie non finie',
        { type: 'tableau', saisies: [{ rang: 0, cle: 'prix', valeur: null }] },
      ],
      [
        'un classement sans catégorie textuelle',
        { type: 'classement', classement: { carte: 1 } },
      ],
      ['une valeur scalaire', 'feuille'],
    ])('refuse %s', async (_forme, valeur) => {
      await expect(
        validateBody(production(valeur), SubmitProductionRequestDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse un identifiant de question de plus de 60 caractères', async () => {
      await expect(
        validateBody(
          {
            questionId: 'q'.repeat(61),
            valeur: { type: 'feuille', neSaitPas: true },
            dureeMs: DUREE_MS,
          },
          SubmitProductionRequestDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST sessions/:id/escape/:parcoursId/tentatives', () => {
    it('accepte une réponse de 1 à 40 caractères', async () => {
      const dto = await validateBody(
        { enigmeId: 'enigme-1', reponse: '142 920', dureeMs: DUREE_MS },
        TenterEnigmeRequestDto,
      );

      expect(dto.reponse).toBe('142 920');
    });

    it.each(['', 'x'.repeat(41)])(
      'refuse la réponse « %s »',
      async (reponse) => {
        await expect(
          validateBody(
            { enigmeId: 'enigme-1', reponse, dureeMs: DUREE_MS },
            TenterEnigmeRequestDto,
          ),
        ).rejects.toThrow(BadRequestException);
      },
    );
  });

  describe('PUT sessions/:id/pulses/:sondageId', () => {
    it.each(['perdu', 'ca-va', 'clair'])('accepte l’état %s', async (etat) => {
      const dto = await validateBody({ etat }, DeclarerJalonRequestDto);

      expect(dto.etat).toBe(etat);
    });

    it('refuse un état hors des trois jalons', async () => {
      await expect(
        validateBody({ etat: 'bof' }, DeclarerJalonRequestDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST sessions/:id/defis/:defiId/tentative', () => {
    it('accepte une tentative de 1 à 2 000 caractères', async () => {
      const dto = await validateBody(
        { texte: 'Multiplier les coefficients.', dureeMs: DUREE_MS },
        SubmitDefiRequestDto,
      );

      expect(dto.texte).toBe('Multiplier les coefficients.');
    });

    it.each([
      ['vide', ''],
      ['de 2 001 caractères', 'x'.repeat(2001)],
    ])('refuse une tentative %s', async (_cas, texte) => {
      await expect(
        validateBody({ texte, dureeMs: DUREE_MS }, SubmitDefiRequestDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST sessions', () => {
    it('garde le corps actuel et accepte version et capacité', async () => {
      const slug = 'b2-01-traitement-information-chiffree';
      const seul = await validateBody(
        { courseSlug: slug },
        OpenSessionRequestDto,
      );
      const complet = await validateBody(
        { courseSlug: slug, version: 3, capacite: 40 },
        OpenSessionRequestDto,
      );

      expect(seul).toEqual({ courseSlug: slug });
      expect(complet).toEqual({ courseSlug: slug, version: 3, capacite: 40 });
    });

    it.each([0, 61, 2.5])('refuse la capacité %p', async (capacite) => {
      await expect(
        validateBody(
          { courseSlug: 'b2-01-traitement-information-chiffree', capacite },
          OpenSessionRequestDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PATCH sessions/:id/control', () => {
    it('accepte une commande de pilotage d’écran', async () => {
      const pilotage = {
        screenId: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
        phase: 'revote',
      };
      const dto = await validateBody({ pilotage }, ControlSessionRequestDto);

      expect(dto.pilotage).toEqual(pilotage);
    });

    it.each([
      ['une phase inconnue', { screenId: 'B2-01-A3-01', phase: 'fin' }],
      ['un étayage négatif', { screenId: 'B2-01-A3-06', etayage: -1 }],
      ['une révélation non booléenne', { screenId: 'B2-01-A5-08', revele: 1 }],
      ['un écran absent', { phase: 'vote' }],
    ])('refuse %s', async (_cas, pilotage) => {
      await expect(
        validateBody({ pilotage }, ControlSessionRequestDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
