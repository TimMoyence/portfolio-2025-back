import { ApiProperty } from '@nestjs/swagger';
import { PresentationInteractions } from '../../domain/SlideInteraction';

/** DTO de réponse pour les interactions d'une présentation. */
export class PresentationInteractionsResponseDto {
  @ApiProperty({ example: 'ia-solopreneurs' })
  slug!: string;

  @ApiProperty({
    description: 'Map slideId → SlideInteractions (present + scroll)',
    example: {
      accroche: {
        present: [
          {
            type: 'poll',
            question: "Qui utilise déjà l'IA ?",
            options: ['ChatGPT', 'Claude', 'Gemini'],
          },
        ],
      },
    },
  })
  interactions!: Record<string, unknown>;

  static fromDomain(
    domain: PresentationInteractions,
  ): PresentationInteractionsResponseDto {
    const dto = new PresentationInteractionsResponseDto();
    dto.slug = domain.slug;
    dto.interactions = domain.interactions;
    return dto;
  }
}
