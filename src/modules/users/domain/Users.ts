export class Users {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  updatedOrCreatedBy: number | null;
}
