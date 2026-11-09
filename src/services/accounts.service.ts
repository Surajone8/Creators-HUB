import { SocialMediaAccount } from "@/types/database";

export class AccountsService {
  async getAccounts(_userId: string): Promise<SocialMediaAccount[]> {
    // Returns empty array by default when no accounts are connected
    return [];
  }
}

export const accountsService = new AccountsService();
