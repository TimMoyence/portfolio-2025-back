import {
  requireText,
  optionalText,
} from '../../../common/domain/validation/domain-validators';
import { Slug } from '../../../common/domain/value-objects/Slug';

export interface CreateCourseProps {
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
}

/** Entite domaine representant une formation dispensee. */
export class Courses {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;

  static create(props: CreateCourseProps): Courses {
    const course = new Courses();
    course.slug = Slug.parse(props.slug, 'course slug').toString();
    course.title = requireText(props.title, 'course title', 2, 160);
    course.summary = requireText(props.summary, 'course summary', 10, 2000);
    course.coverImage = optionalText(
      props.coverImage,
      'course cover image',
      500,
    );
    return course;
  }
}
