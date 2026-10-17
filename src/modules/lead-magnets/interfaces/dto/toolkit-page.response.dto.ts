import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AI_LEVELS, type ToolkitContent } from '../../domain/ToolkitContent';

class ToolkitRecapDto {
  @ApiProperty()
  firstName: string;
}

class CheatsheetEntryDto {
  @ApiProperty()
  tool: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  tip: string;

  @ApiProperty()
  decision: string;
}

class PromptEntryDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: AI_LEVELS })
  level: string;

  @ApiProperty()
  prompt: string;

  @ApiProperty()
  tool: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  example?: string;

  @ApiPropertyOptional()
  tip?: string;
}

class WorkflowStepDto {
  @ApiProperty({ type: 'integer' })
  step: number;

  @ApiProperty()
  action: string;

  @ApiProperty()
  tool: string;

  @ApiProperty()
  detail: string;
}

class WorkflowEntryDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  setupTime: string;

  @ApiProperty()
  monthlyCost: number;

  @ApiProperty({ type: [WorkflowStepDto] })
  steps: WorkflowStepDto[];

  @ApiProperty({ type: [String] })
  tools: string[];
}

class TemplateEntryDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  minBudget: number;
}

export class ToolkitPageResponseDto {
  @ApiProperty({ type: ToolkitRecapDto })
  recap: ToolkitContent['recap'];

  @ApiProperty({ type: [CheatsheetEntryDto] })
  cheatsheet: ToolkitContent['cheatsheet'];

  @ApiProperty({ type: [PromptEntryDto] })
  prompts: ToolkitContent['prompts'];

  @ApiProperty({ type: [WorkflowEntryDto] })
  workflows: ToolkitContent['workflows'];

  @ApiProperty({ type: [TemplateEntryDto] })
  templates: ToolkitContent['templates'];

  static fromContent(content: ToolkitContent): ToolkitPageResponseDto {
    const dto = new ToolkitPageResponseDto();
    dto.recap = content.recap;
    dto.cheatsheet = content.cheatsheet;
    dto.prompts = content.prompts;
    dto.workflows = content.workflows;
    dto.templates = content.templates;
    return dto;
  }
}
