import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EntierBorne } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';

const DUREE_MAX_MS = 5 * 60 * 60 * 1000;

export function DureeDeReponse(exemple: number): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ example: exemple }),
    EntierBorne(0, DUREE_MAX_MS),
  );
}
