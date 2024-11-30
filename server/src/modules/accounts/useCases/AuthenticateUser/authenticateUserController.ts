import { Request, Response, NextFunction } from 'npm:@types/express';
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { ApplicationError, BadRequestError, InvalidParameterError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import auth from '@config/auth.ts'
import { expiryDateMapper } from "@utils/expiryDateMapper.ts";

export const authenticateUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    password
  } = request.body;
  if (!(email && password)) {
    next(new BadRequestError('Request body is missing information to authenticate this user!'));
  }
  const { refresh_token_expires_in } = auth;
  if (!refresh_token_expires_in) {
    throw new InvalidParameterError('Server is not accessing .env variables used on authentication cofig file! Fatal Error. Contact admin!');
  }

  let sessionInfo;
  try {
    sessionInfo = await authenticateUserService.execute({
      email,
      password,
    });
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Authenticate User: Unknown error!', 500, error as Error);
  }
  
  if (!sessionInfo) {
    next(new NotFoundError('Session for this user was not found.'));
  }
  
  const { refresh_token, token, user } = sessionInfo;
  const maxAge = expiryDateMapper(refresh_token_expires_in!) / 1000;
  console.log('AuthUser-> MaxAge:', maxAge)

  response.cookie('refresh_token', refresh_token, {
    httpOnly: true,  // prevents JS access
    // disabling bellow options for testing
    // secure: true,    // only HTTPS
    // sameSite: 'strict', // avoid CSRF
    maxAge,
  });

  return response.json({
    user,
    token
  });
}