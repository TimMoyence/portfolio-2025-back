import { BadRequestException } from '@nestjs/common';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { of } from 'rxjs';
import { createHttpExecutionContext } from '../../../../../test/factories/execution-context.factory';
import { methodeDe } from '../../../../../test/helpers/metadonnees-de-route';
import { AuditsController } from '../../../../modules/audit-requests/interfaces/Audits.controller';
import { ContactsController } from '../../../../modules/contacts/interfaces/Contacts.controller';
import { FormationsStudentController } from '../../../../modules/formations/interfaces/FormationsStudent.controller';
import { LeadMagnetsController } from '../../../../modules/lead-magnets/interfaces/LeadMagnets.controller';
import { IntercepteurAntiRobot } from '../intercepteur-anti-robot';

const intercepteur = new IntercepteurAntiRobot();
const SUITE = of('suite');

const soumettre = (body: unknown) =>
  intercepteur.intercept(createHttpExecutionContext({ body }), {
    handle: () => SUITE,
  });

const REFUS = new BadRequestException('Invalid request');
const INSTANT_DE_SOUMISSION = Date.UTC(2026, 9, 16, 15, 0, 0);

describe('IntercepteurAntiRobot', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(INSTANT_DE_SOUMISSION);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('laisse passer une saisie humaine après le délai minimal', () => {
    expect(
      soumettre({
        website: '',
        formFillDurationMs: 2_000,
      }),
    ).toBe(SUITE);
  });

  it.each([
    ['en avance d une heure', INSTANT_DE_SOUMISSION + 3_600_000],
    ['en avance de 30 s pour 20 s de saisie', INSTANT_DE_SOUMISSION + 10_000],
  ])(
    'ne refuse pas un poste dont l horloge est %s sur celle du serveur',
    (_cas, formStartedAt) => {
      expect(soumettre({ formStartedAt, formFillDurationMs: 20_000 })).toBe(
        SUITE,
      );
      expect(soumettre({ formStartedAt })).toBe(SUITE);
    },
  );

  it('laisse passer les clients qui ignorent encore les champs anti-robot', () => {
    expect(soumettre({})).toBe(SUITE);
    expect(soumettre(undefined)).toBe(SUITE);
  });

  it('refuse un piège rempli, avec une erreur générique', () => {
    expect(() => soumettre({ website: 'https://spam.test' })).toThrow(REFUS);
  });

  it('refuse un piège qui n est pas un texte', () => {
    expect(() => soumettre({ website: 42 })).toThrow(REFUS);
  });

  it('refuse une soumission plus rapide qu une saisie humaine', () => {
    expect(() => soumettre({ formFillDurationMs: 0 })).toThrow(REFUS);
    expect(() => soumettre({ formFillDurationMs: 1_199 })).toThrow(REFUS);
    expect(() => soumettre({ formFillDurationMs: -5_000 })).toThrow(REFUS);
  });

  it('refuse une durée de saisie qui n est pas un nombre fini', () => {
    expect(() => soumettre({ formFillDurationMs: 'longtemps' })).toThrow(REFUS);
  });
});

const FORMULAIRES_PUBLICS = [
  methodeDe(AuditsController, 'create'),
  methodeDe(ContactsController, 'create'),
  methodeDe(FormationsStudentController, 'join'),
  methodeDe(LeadMagnetsController, 'create'),
];

describe('Formulaires publics', () => {
  it.each(FORMULAIRES_PUBLICS)(
    'la route %# passe par l intercepteur anti-robot',
    (handler) => {
      expect(Reflect.getMetadata(INTERCEPTORS_METADATA, handler)).toContain(
        IntercepteurAntiRobot,
      );
    },
  );
});
