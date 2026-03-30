import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { Courses } from '../../domain/Courses';
import { CreateCourseCommand } from '../dto/CreateCourse.command';

export class CourseMapper {
  static fromCreateCommand(command: CreateCourseCommand): Courses {
    return mapDomainValidation(() => Courses.create(command));
  }
}
