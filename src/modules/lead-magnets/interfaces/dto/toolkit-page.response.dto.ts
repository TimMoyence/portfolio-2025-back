import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ToolkitContent } from '../../domain/ToolkitContent';

export class ToolkitPageResponseDto {
  @ApiProperty()
  recap: ToolkitContent['recap'];

  @ApiProperty({ type: Array })
  cheatsheet: ToolkitContent['cheatsheet'];

  @ApiProperty()
  prompts: Array<{
    category: string;
    title: string;
    level: string;
    prompt: string;
    tool: string;
  }>;

  @ApiProperty({ type: Array })
  workflows: ToolkitContent['workflows'];

  @ApiProperty({ type: Array })
  templates: ToolkitContent['templates'];

  @ApiPropertyOptional()
  generatedPrompt: string | null;

  static fromContent(content: ToolkitContent): ToolkitPageResponseDto {
    const dto = new ToolkitPageResponseDto();
    dto.recap = content.recap;
    dto.cheatsheet = content.cheatsheet;
    dto.prompts = content.prompts;
    dto.workflows = content.workflows;
    dto.templates = content.templates;
    dto.generatedPrompt = content.generatedPrompt;
    return dto;
  }
}
