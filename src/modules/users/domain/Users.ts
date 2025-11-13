export class Users {
  id?: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedOrCreatedBy: string | null;
}
