import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { Courses } from '../../domain/Courses';
import { CreateCourseCommand } from '../dto/CreateCourse.command';

export class CourseMapper {
  static fromCreateCommand(command: CreateCourseCommand): Courses {
    try {
      return Courses.create(command);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
