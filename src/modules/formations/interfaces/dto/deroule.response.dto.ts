import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { EcranPublicResponseDto, SujetResponseDto } from './sujet.response.dto';

export class ConfusionCorrigeeResponseDto {
  @ApiProperty({ example: 'hausse-baisse-symetriques' })
  id: string;

  @ApiProperty({
    example:
      'Croire qu’une hausse puis une baisse du même pourcentage ramènent à la valeur de départ.',
  })
  libelle: string;
}

export class CorrigePresentateurResponseDto {
  @ApiProperty({ example: 'Q-OUV-RAPPEL' })
  questionId: string;

  @ApiProperty({
    description:
      'Bonne reponse du tirage de reference : libelle pour un vote, valeur pour une question numerique',
    example: 'plus bas qu’au départ',
  })
  bonneReponse: string;

  @ApiProperty({ type: [ConfusionCorrigeeResponseDto] })
  confusions: ConfusionCorrigeeResponseDto[];
}

export class GuideFormateurResponseDto {
  @ApiPropertyOptional({
    example: 'Avant de commenter la pente, vérifiez le repère.',
  })
  aDire?: string;

  @ApiPropertyOptional({
    example: 'Que faut-il contrôler avant de comparer les deux courbes ?',
  })
  question?: string;

  @ApiPropertyOptional({
    example: 'Les valeurs, l’unité, la période et l’échelle.',
  })
  reponse?: string;

  @ApiPropertyOptional({
    example: 'Poids d’un canal = CA du canal / CA total.',
  })
  calcul?: string;

  @ApiPropertyOptional({
    example: 'Les valeurs ont-elles changé ou seulement la représentation ?',
  })
  relance?: string;

  @ApiPropertyOptional({
    example:
      'Le prochain écran montre comment une échelle modifie l’impression.',
  })
  transition?: string;
}

export class EcranDerouleResponseDto extends EcranPublicResponseDto {
  @ApiProperty({ description: 'Notes du formateur' })
  notes: string;

  @ApiProperty({
    description:
      'Seuil de reussite du pivot, null pour un ecran sans question a seuil',
    example: 0.7,
    nullable: true,
    type: Number,
  })
  seuil: number | null;

  @ApiProperty({ type: [CorrigePresentateurResponseDto] })
  corriges: CorrigePresentateurResponseDto[];

  @ApiPropertyOptional({
    type: GuideFormateurResponseDto,
    description:
      'Guide de l écran pour le formateur, absent quand l écran n en a pas',
  })
  guide?: GuideFormateurResponseDto;
}

export class DerouleResponseDto extends OmitType(SujetResponseDto, [
  'ecrans',
] as const) {
  @ApiProperty({ type: [EcranDerouleResponseDto] })
  ecrans: EcranDerouleResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Identifiant de l ecran de remediation de chaque confusion',
    example: { 'hausse-baisse-symetriques': 'E-CLO-SUCCESSIVES' },
  })
  remediations: Record<string, string>;
}
