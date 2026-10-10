import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { createHttpExecutionContext } from '../../../../../test/factories/execution-context.factory';
import { methodeDe } from '../../../../../test/helpers/metadonnees-de-route';
import { AuditsController } from '../../../../modules/audit-requests/interfaces/Audits.controller';
import { ContactsController } from '../../../../modules/contacts/interfaces/Contacts.controller';
import { FormationsStudentController } from '../../../../modules/formations/interfaces/FormationsStudent.controller';
import { LeadMagnetsController } from '../../../../modules/lead-magnets/interfaces/LeadMagnets.controller';
import { NewsletterController } from '../../../../modules/newsletter/interfaces/Newsletter.controller';
import { GardeAntiRobot } from '../garde-anti-robot';

const garde = new GardeAntiRobot();

const soumettre = (body: unknown): boolean =>
  garde.canActivate(createHttpExecutionContext({ body }));

const REFUS = new BadRequestException('Invalid request');

describe('GardeAntiRobot', () => {
  it('laisse passer une saisie humaine après le délai minimal', () => {
    expect(soumettre({ website: '', formStartedAt: Date.now() - 2_000 })).toBe(
      true,
    );
  });

  it('laisse passer les clients qui ignorent encore les champs anti-robot', () => {
    expect(soumettre({})).toBe(true);
    expect(soumettre(undefined)).toBe(true);
  });

  it('refuse un piège rempli, avec une erreur générique', () => {
    expect(() => soumettre({ website: 'https://spam.test' })).toThrow(REFUS);
  });

  it('refuse un piège qui n est pas un texte', () => {
    expect(() => soumettre({ website: 42 })).toThrow(REFUS);
  });

  it('refuse une soumission plus rapide qu une saisie humaine', () => {
    expect(() => soumettre({ formStartedAt: Date.now() })).toThrow(REFUS);
  });

  it('refuse un horodatage qui n est pas un nombre fini', () => {
    expect(() => soumettre({ formStartedAt: 'hier' })).toThrow(REFUS);
  });
});

const FORMULAIRES_PUBLICS = [
  methodeDe(AuditsController, 'create'),
  methodeDe(ContactsController, 'create'),
  methodeDe(FormationsStudentController, 'join'),
  methodeDe(LeadMagnetsController, 'create'),
  methodeDe(NewsletterController, 'subscribeEndpoint'),
];

describe('Formulaires publics', () => {
  it.each(FORMULAIRES_PUBLICS)(
    'la route %# passe par la garde anti-robot',
    (handler) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
        GardeAntiRobot,
      );
    },
  );
});
