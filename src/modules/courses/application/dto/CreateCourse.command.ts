export interface CreateCourseCommand {
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
}
