import { Request, Response, NextFunction } from 'npm:@types/express';

import auth from "../../../../config/auth.ts";
import { expiryDateMapper } from "../../../../utils/expiryDateMapper.ts";
import { ApplicationError, BadRequestError, NotFoundError } from "../../../../shared/errors/ApplicationError.ts";
import { refreshUserTokenService } from "./refreshUserTokenService.ts";

export const refreshUserTokenController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    refresh_token
  } = request.cookies;

  if (!refresh_token) {
    return next(new BadRequestError('Refresh token doesn\'t exists for this client. User will need to login again!'));
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
  const expireDateDays = auth.refresh_token_expires_in;
  const maxAge = expiryDateMapper(expireDateDays as string);

  response.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,  // prevents JS access
    secure: true,    // only HTTPS
    sameSite: 'strict', // avoid CSRF
    maxAge,
  });

  return response.json({
    token
  });
}