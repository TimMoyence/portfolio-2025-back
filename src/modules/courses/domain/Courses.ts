import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export interface CreateCourseProps {
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
}

export class Courses {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;

  static create(props: CreateCourseProps): Courses {
    const course = new Courses();
    course.slug = this.requireSlug(props.slug, 'course slug');
    course.title = this.requireText(props.title, 'course title', 2, 160);
    course.summary = this.requireText(
      props.summary,
      'course summary',
      10,
      2000,
    );
    course.coverImage = this.optionalText(
      props.coverImage,
      'course cover image',
      500,
    );
    return course;
  }

  private static requireSlug(raw: unknown, field: string): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const slug = raw.trim().toLowerCase();
    if (slug.length < 2 || slug.length > 120) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return slug;
  }

  private static requireText(
    raw: unknown,
    field: string,
    min: number,
    max: number,
  ): string {
    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const value = raw.trim();
    if (value.length < min || value.length > max) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return value;
  }

  private static optionalText(
    raw: unknown,
    field: string,
    max: number,
  ): string | undefined {
    if (raw === undefined || raw === null) {
      return undefined;
    }

    if (typeof raw !== 'string') {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const value = raw.trim();
    if (value.length === 0) {
      return undefined;
    }

    if (value.length > max) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    return value;
  }
}
