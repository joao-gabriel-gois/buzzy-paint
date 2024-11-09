import { v4 as uuid } from 'uuid';
import { UUID } from "../@types/index.d.ts";

import { User } from "./User.ts";
import { IUsersRepository } from "../repositories/IUsersRepository.ts";
import { ICreateUserTokensDTO } from "../DTOs/CreateUserTokensDTO.ts";
import { ApplicationError } from "../../../shared/errors/ApplicationError.ts";

export class UserTokens {
  private usersRepository: IUsersRepository;
  
  public id: UUID;
  public refresh_token: string;
  public user_id: UUID;
  public user: User | undefined;
  public expiration_date: Date;

  constructor(
    userTokensDTO: ICreateUserTokensDTO,
    usersRepository: IUsersRepository
  ) {
    const {
      id,
      refresh_token,
      user_id,
      expiration_date,
    } = userTokensDTO;

  
    this.usersRepository = usersRepository;
    
    this.id = id ? id : uuid();
    this.refresh_token = refresh_token;
    this.user_id = user_id;
    this.expiration_date = expiration_date;
    this.user = undefined;
  }

  async getTokenOwner() {
    try {
      const user = await this.usersRepository.getUserById(this.user_id);
      this.user = user as User;
    }
    catch(error) {
      throw new ApplicationError('Not able to get user\'s token', 500, error as Error);
    }
  }
}
