import type { ToolkitContent } from './ToolkitContent';

export interface IToolkitContentAssembler {
  assemble(firstName: string): ToolkitContent;
}
