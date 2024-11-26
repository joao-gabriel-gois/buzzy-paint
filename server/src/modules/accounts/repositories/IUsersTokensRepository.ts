import { ICreateUserTokensDTO } from "../DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "../models/UserTokens.ts";

export default interface IUsersTokensRepository {
   create({ user_id, expiration_date, refresh_token}: ICreateUserTokensDTO): Promise<UserTokens>;
   findByRefreshTokenAndUserId(refresh_token: string, user_id: string): Promise<UserTokens | undefined>;
   deleteById(id: string): Promise<void>;
   findByRefreshToken(refresh_token: string): Promise<UserTokens | undefined>;
   findByUserId(refresh_token: string): Promise<UserTokens | undefined>;
}
