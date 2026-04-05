/** Commande pour lier un compte Telegram a un utilisateur. */
export interface LinkTelegramCommand {
  telegramUserId: number;
  email: string;
}
