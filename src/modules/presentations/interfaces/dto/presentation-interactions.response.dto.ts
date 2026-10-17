import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import type {
  PresentationInteractions,
  SlideInteractions,
} from '../../domain/SlideInteraction';

class PollInteractionDto {
  @ApiProperty({ enum: ['poll'] })
  type!: 'poll';

  @ApiProperty()
  question!: string;

  @ApiProperty({ type: [String] })
  options!: string[];

  @ApiPropertyOptional()
  multiSelect?: boolean;
}

class ReflectionInteractionDto {
  @ApiProperty({ enum: ['reflection'] })
  type!: 'reflection';

  @ApiProperty()
  question!: string;

  @ApiProperty()
  placeholder!: string;

  @ApiPropertyOptional({ type: 'integer' })
  rows?: number;
}

class SlideInteractionsDto {
  @ApiPropertyOptional({ type: [PollInteractionDto] })
  present?: PollInteractionDto[];

  @ApiPropertyOptional({ type: [ReflectionInteractionDto] })
  scroll?: ReflectionInteractionDto[];
}

@ApiExtraModels(SlideInteractionsDto)
export class PresentationInteractionsResponseDto {
  @ApiProperty({ example: 'ia-solopreneurs' })
  slug!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(SlideInteractionsDto) },
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
  interactions!: Record<string, SlideInteractions>;

  static fromDomain(
    domain: PresentationInteractions,
  ): PresentationInteractionsResponseDto {
    const dto = new PresentationInteractionsResponseDto();
    dto.slug = domain.slug;
    dto.interactions = domain.interactions;
    return dto;
  }
}
