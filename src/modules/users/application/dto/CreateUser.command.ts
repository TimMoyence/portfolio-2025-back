export interface CreateUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  roles?: string[];
  updatedOrCreatedBy?: string | null;
}

export interface CreateUserResult {
  user: import('../../domain/User').User;
}
