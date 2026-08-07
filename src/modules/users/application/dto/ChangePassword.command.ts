export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
  updatedOrCreatedBy?: string | null;
}
