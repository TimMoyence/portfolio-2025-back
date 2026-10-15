import { ApiProperty } from '@nestjs/swagger';

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
