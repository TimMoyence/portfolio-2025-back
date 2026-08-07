export interface SetPasswordCommand {
  userId: string;
  newPassword: string;
  updatedOrCreatedBy?: string | null;
}
