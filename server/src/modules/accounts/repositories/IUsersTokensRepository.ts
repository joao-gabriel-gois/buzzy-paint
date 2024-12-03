import { ICreateUserTokensDTO } from "@modules/accounts/DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "@modules/accounts/models/UserTokens.ts";

export default interface IUsersTokensRepository {
   create({ user_id, expiration_date, refresh_token}: ICreateUserTokensDTO): Promise<UserTokens>;
   deleteById(id: string): Promise<void>;
   findAllByUserId(token: string): Promise<UserTokens[] | undefined>;
   findUniqueByRefreshTokenAndUserId(refresh_token: string, user_id: UUID): Promise<UserTokens | undefined>;
   deleteExpiredRefreshTokens(): Promise<void>;
}
