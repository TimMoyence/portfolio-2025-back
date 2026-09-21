import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
