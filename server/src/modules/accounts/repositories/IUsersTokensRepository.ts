import { UUID } from "../@types/index.d.ts";
import { ICreateUserTokensDTO } from "../DTOs/CreateUserTokensDTO.ts";
import { UserTokens } from "../models/UserTokens.ts";

export default interface IUsersTokensRepository {
   create({ user_id, expiration_date, refresh_token}: ICreateUserTokensDTO): Promise<UserTokens>;
   deleteById(id: string): Promise<void>;
   findAllByUserId(token: string): Promise<UserTokens[] | undefined>;
   findUniqueByRefreshTokenAndUserId(refresh_token: string, user_id: UUID): Promise<UserTokens | undefined>;
  //  findUniqueByRefreshToken(refresh_token: string): Promise<UserTokens | undefined>;
}
