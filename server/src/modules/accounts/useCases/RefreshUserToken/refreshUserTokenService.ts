import { sign, verify } from "npm:jsonwebtoken";
import auth from "@config/auth.ts"
import { InvalidParameterError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { IUsersTokensRepository } from "@modules/accounts/repositories/IUsersTokensRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts";
import { expiryDateMapper } from "@utils/expiryDateMapper.ts";
import { UserTokens } from "@modules/accounts/models/UserTokens.ts";

interface IRefreshAuthRequest {
  sub: string;
  email: string;
}

interface IRefreshAuthResponse {
  token: string;
  refresh_token: string;
}

// class is exportable only for unit tests.
// Do not import it anywhere else to keep all
// services as singletons.
export class RefreshTokenService {
  constructor(
    private usersTokensRepository: IUsersTokensRepository,
  ) {};
  
  async execute(refresh_token: string): Promise<IRefreshAuthResponse> {
    const {
      refresh_token_secret,
      refresh_token_expires_in,
      token_secret,
      token_expires_in 
    } = auth;

    if (!(token_secret || token_expires_in || refresh_token_secret || refresh_token_expires_in)) {
      throw new InvalidParameterError("Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!");
    }

    let userToken: UserTokens | undefined;
    let email: string;
    let user_id: string;
    try {
      const verifyResponse = verify(refresh_token, refresh_token_secret) as IRefreshAuthRequest;
      email = verifyResponse.email;
      user_id = verifyResponse.sub;
      userToken = await this.usersTokensRepository
        .findUniqueByRefreshTokenAndUserId(refresh_token, user_id as UUID);
    }
    catch (_) {
      throw new NotFoundError("Refresh Token Mismatch! Token informed was not found for this user");
    }

    if (!userToken) {
      throw new NotFoundError("Refresh Token Mismatch! Token informed was not found for this user");
    }
    
    await this.usersTokensRepository.deleteById(userToken.id);

    const new_refresh_token = sign({ email }, refresh_token_secret, {
      subject: user_id,
      expiresIn: refresh_token_expires_in,
    });

    const expiration_date = new Date(Date.now() + expiryDateMapper("2d")).toISOString(); // 2 days from now

    await this.usersTokensRepository.create({
      user_id: user_id as UUID,
      expiration_date,
      refresh_token: new_refresh_token
    })
        
    const newToken = sign({}, token_secret, {
      subject: user_id,
      expiresIn: token_expires_in,
    });

    return {
      token: newToken,
      refresh_token: new_refresh_token,
    };
  }
}

export const refreshUserTokenService = new RefreshTokenService(usersTokensRepository);
