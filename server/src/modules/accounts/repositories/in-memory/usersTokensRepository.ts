import { IUsersTokensRepository } from "@modules/accounts/repositories/IUsersTokensRepository.ts";
import { ICreateUserTokensDTO } from "../../DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "../../models/UserTokens.ts";
import { DatabaseTransactionError } from "@shared/errors/ApplicationError.ts";

class UsersTokensRepositoryInMemory implements IUsersTokensRepository {
  private usersTokens: UserTokens[] = [];

  async create(createUserTokenDTO: ICreateUserTokensDTO): Promise<UserTokens> {
    try {
      const userToken = new UserTokens(createUserTokenDTO);
      this.usersTokens.push(userToken);
      
      return await new Promise((resolve, _) => setTimeout(() => resolve(userToken), 100));
    } catch (_) {
      throw new DatabaseTransactionError("Database Transaction for creating token for this user has failed");
    }
  }

  async findAllByUserId(user_id: string): Promise<UserTokens[] | undefined> {
    try {
      const tokens = this.usersTokens.filter(token => token.user_id === user_id);

      return await new Promise((resolve, _) => setTimeout(() => resolve(tokens.length > 0 ? tokens : undefined), 100));
    } catch (_) {
      throw new DatabaseTransactionError("Database Transaction for finding Tokens for a certain user_id has failed.");
    }
  }

  async findUniqueByRefreshTokenAndUserId(refresh_token: string, user_id: string): Promise<UserTokens | undefined> {
    try {
      const token = this.usersTokens.find(
        token => token.refresh_token === refresh_token && token.user_id === user_id
      );
      
      return await new Promise((resolve, _) => setTimeout(() => resolve(token), 100));
    } catch (_) {
      throw new DatabaseTransactionError(
        "Database Transaction for finding Token by refresh_token and user_id has failed."
      );
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      const tokenIndex = this.usersTokens.findIndex(token => token.id === id);
      
      if (tokenIndex >= 0) {
        await new Promise((resolve, _) => resolve(this.usersTokens.splice(tokenIndex, 1)));
      }
    } catch (_) {
      throw new DatabaseTransactionError(
        "Database Transaction for deleting token for this user has failed"
      );
    }
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    try {
      const currentDate = new Date();
      
      await new Promise((resolve, _) => setTimeout(() => resolve(
        this.usersTokens = this.usersTokens.filter(token => {
          const expirationDate = new Date(token.expiration_date);
          const thirtyDaysAgo = new Date(currentDate);
          
          thirtyDaysAgo.setDate(currentDate.getDate() - 30);
          
          return expirationDate > thirtyDaysAgo;
        })
      ), 100));
    } catch (_) {
      throw new DatabaseTransactionError(
        "Database Transaction for deleting all expired refresh tokens has failed"
      );
    }
  }

  // async expireToken(refreshToken: string): Promise<void> {
  //   return await new Promise<void>((resolve, _) => setTimeout(() => {
  //     const tokenIndex = this.usersTokens.findIndex(token => token.refresh_token === refreshToken);
  //     console.log('token before forcing expire:', this.usersTokens[tokenIndex]);
  //     if (tokenIndex !== -1) {
  //       // set its expiry date to 31 days ago
  //       this.usersTokens[tokenIndex].expiration_date = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  //       console.log('token after forcing expire:', this.usersTokens[tokenIndex]);
  //     }
  //     resolve();
  //   }, 100));
  // }

  clear(): void {
    this.usersTokens = [];
  }
}


export const usersTokensRepository = new UsersTokensRepositoryInMemory();
