/* eslint-disable @typescript-eslint/unbound-method */
import type { Request } from 'express';
import { buildTeacherAnnotationRecord } from '../../../../../test/factories/formation.factory';
import { ROLES_KEY } from '../../../../common/interfaces/auth/roles.decorator';
import { FormationsAnnotationsController } from '../FormationsAnnotations.controller';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const ADMIN_ID = 'c1e2d3c4-b5a6-4978-8899-aabbccddeeff';

describe('FormationsAnnotationsController', () => {
  const annotations = { list: jest.fn(), save: jest.fn() };
  const controller = new FormationsAnnotationsController(annotations as never);
  const requete = {
    user: { sub: ADMIN_ID, roles: ['admin'] },
  } as unknown as Request;

  it('lit les annotations avec l identite et les roles de l appelant', async () => {
    annotations.list.mockResolvedValue([buildTeacherAnnotationRecord()]);

    await expect(
      controller.getAnnotations(SESSION_ID, requete),
    ).resolves.toEqual({ annotations: [buildTeacherAnnotationRecord()] });
    expect(annotations.list).toHaveBeenCalledWith(SESSION_ID, {
      id: ADMIN_ID,
      roles: ['admin'],
    });
  });

  it('confie l ecriture au cas d usage au nom de l appelant', async () => {
    const annotation = {
      screenId: 'B2-01-S11-REFLECTION',
      note: 'Relancer',
    };
    annotations.save.mockResolvedValue(buildTeacherAnnotationRecord());

    await expect(
      controller.saveAnnotation(SESSION_ID, annotation, requete),
    ).resolves.toEqual(buildTeacherAnnotationRecord());
    expect(annotations.save).toHaveBeenCalledWith(
      SESSION_ID,
      ADMIN_ID,
      annotation,
    );
  });

  it('ouvre la lecture a l administrateur mais pas l ecriture', () => {
    expect([
      Reflect.getMetadata(
        ROLES_KEY,
        FormationsAnnotationsController.prototype.getAnnotations,
      ),
      Reflect.getMetadata(
        ROLES_KEY,
        FormationsAnnotationsController.prototype.saveAnnotation,
      ),
      Reflect.getMetadata(ROLES_KEY, FormationsAnnotationsController),
    ]).toEqual([['teacher', 'admin'], undefined, ['teacher']]);
  });
});
