import { ProjectStatus, ProjectType } from '../../domain/Projects';

export interface CreateProjectCommand {
  slug: string;
  type?: ProjectType;
  repoUrl?: string;
  liveUrl?: string;
  coverImage?: string;
  gallery?: string[];
  stack?: string[];
  status?: ProjectStatus;
  order?: number;
}
