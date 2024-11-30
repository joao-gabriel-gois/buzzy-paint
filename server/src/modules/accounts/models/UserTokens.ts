import { v4 as uuid } from 'npm:uuid';
import { ICreateUserTokensDTO } from "@modules/accounts/DTOs/CreateUserTokensDTO.ts";


export class UserTokens {
  public id: UUID;
  public refresh_token: string;
  public user_id: UUID;
  public expiration_date: string;

  constructor(
    userTokensDTO: ICreateUserTokensDTO
  ) {
    const {
      id,
      refresh_token,
      user_id,
      expiration_date,
    } = userTokensDTO;

    
    this.id = id ? id : uuid() as UUID;
    this.refresh_token = refresh_token;
    this.user_id = user_id;
    this.expiration_date = expiration_date;
  }
}
