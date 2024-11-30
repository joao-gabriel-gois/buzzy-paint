import { sign, verify } from 'npm:jsonwebtoken';
import auth from "@config/auth.ts"
import { InvalidParameterError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import IUsersTokensRepository from "@modules/accounts/repositories/IUsersTokensRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts";
import { expiryDateMapper } from "@utils/expiryDateMapper.ts";

interface IPayload {
  sub: string;
  email: string;
}

interface ITokenResponse {
  token: string;
  refresh_token: string;
}

export default class RefreshTokenService {
  constructor(
    private usersTokensRepository: IUsersTokensRepository,
  ) {};
  
  async execute(refresh_token: string): Promise<ITokenResponse> {
    const {
      refresh_token_secret,
      refresh_token_expires_in,
      token_secret,
      token_expires_in 
    } = auth;

    if (!(token_secret || token_expires_in || refresh_token_secret || refresh_token_expires_in)) {
      throw new InvalidParameterError('Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!');
    }
    const { email, sub: user_id } = verify(refresh_token, refresh_token_secret) as IPayload;

    const userToken = await this.usersTokensRepository
      .findUniqueByRefreshTokenAndUserId(refresh_token, user_id as UUID);

    if (!userToken) {
      throw new NotFoundError('Refresh Token Mismatch! Token informed was not found for this user')
    }

    await this.usersTokensRepository.deleteById(userToken.id);

    const new_refresh_token = sign({ email }, refresh_token_secret, {
      subject: user_id,
      expiresIn: refresh_token_expires_in,
    });

    const expiration_date = new Date(Date.now() + expiryDateMapper('2d')).toISOString(); // 2 days from now

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
      refresh_token,
    };
  }
}

export const refreshUserTokenService = new RefreshTokenService(usersTokensRepository);
