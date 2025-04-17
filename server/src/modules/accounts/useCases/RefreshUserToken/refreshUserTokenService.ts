import { sign, verify } from "npm:jsonwebtoken";
import auth from "@config/auth.ts"
import { IRefreshAuthRequest, IRefreshAuthResponse } from "@modules/accounts/useCases/interfaces.ts";
import { UserTokens } from "@modules/accounts/models/UserTokens.ts";
import { usersTokensRepository as prodUsersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts";
import { usersTokensRepository as testUsersTokensRepository  } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";import { expiryDateMapper } from "@utils/expiryDateMapper.ts";
import { InvalidParameterError, NotFoundError } from "@shared/errors/ApplicationError.ts";

const ENV = Deno.env.get('ENV');
const usersTokensRepository = ENV === 'test' ? testUsersTokensRepository : prodUsersTokensRepository;

export async function refreshUserTokenService(refresh_token: string): Promise<IRefreshAuthResponse> {
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
    userToken = await usersTokensRepository
      .findUniqueByRefreshTokenAndUserId(refresh_token, user_id as UUID);
  }
  catch (_) {
    throw new NotFoundError("Refresh Token Mismatch! Token informed was not found for this user");
  }

  if (!userToken) {
    throw new NotFoundError("Refresh Token Mismatch! Token informed was not found for this user");
  }
  
  await usersTokensRepository.deleteById(userToken.id);

  const new_refresh_token = sign({ email }, refresh_token_secret, {
    subject: user_id,
    expiresIn: refresh_token_expires_in,
  });

  const expiration_date = new Date(Date.now() + expiryDateMapper("2d")).toISOString(); // 2 days from now

  await usersTokensRepository.create({
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
