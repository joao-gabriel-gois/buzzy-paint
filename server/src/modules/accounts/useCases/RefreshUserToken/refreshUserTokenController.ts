import { Request, Response, NextFunction } from 'npm:@types/express';

import auth from "@config/auth.ts";
import { expiryDateMapper } from "@utils/expiryDateMapper.ts";
import { ApplicationError, BadRequestError, InvalidParameterError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { refreshUserTokenService } from "@modules/accounts/useCases/RefreshUserToken/refreshUserTokenService.ts";

export const refreshUserTokenController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    refresh_token
  } = request.cookies;

  if (!refresh_token) {
    return next(new BadRequestError('Refresh token doesn\'t exists for this user. User will need to login again!'));
  }
  
  // refresh_token = refresh_token.split('=')[1].split(';')[0];
  
  const { refresh_token_expires_in } = auth;
  if (!refresh_token_expires_in) {
    throw new InvalidParameterError('Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!');
  }
  let refreshedSessionInfo;
  try {
    refreshedSessionInfo = await refreshUserTokenService.execute(refresh_token);
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new ApplicationError('Refresh User Token: Unknown error!', 500, error as Error));
  }
   
  if (!refreshedSessionInfo) {
    throw new NotFoundError('Session for this user was not found, after token refresh, aborting!');
  }
  
  const { refresh_token: newRefreshToken, token } = refreshedSessionInfo;
  
  const maxAge = expiryDateMapper(refresh_token_expires_in!);
  response.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,  // prevents JS access
    maxAge,
    // disabling bellow options for testing
    // secure: true,    // only HTTPS, turn it on in prod
    // sameSite: 'strict', // avoid CSRF
  });

  return response.json({
    token
  });
}