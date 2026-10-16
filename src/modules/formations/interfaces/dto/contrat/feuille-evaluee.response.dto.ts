import { ApiProperty } from '@nestjs/swagger';
import type { NatureDeCellule } from '../../../domain/contrats/donnees-publiques';

export class FeuilleEvalueeResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Saisie retenue de chaque cellule de l eleve, recopie comprise, imposees exclues',
    example: { D2: '=C2*2', D3: '=C3*2' },
  })
  saisies: Record<string, string>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Ce qu affiche chaque cellule non vide : resultat de la formule, code d erreur ou saisie',
    example: { C2: '6400', D2: '12800' },
  })
  affichages: Record<string, string>;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: ['texte', 'nombre', 'logique', 'erreur'],
    },
    description: 'Nature de la valeur affichee par chaque cellule non vide',
    example: { C2: 'nombre', D2: 'nombre' },
  })
  natures: Record<string, NatureDeCellule>;

  @ApiProperty({
    type: [String],
    description: 'Cellules dont la saisie est une formule',
    example: ['D2', 'D3'],
  })
  formules: readonly string[];
}
