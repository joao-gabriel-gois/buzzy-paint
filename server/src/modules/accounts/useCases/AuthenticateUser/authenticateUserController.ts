import { Request, Response, NextFunction } from 'npm:@types/express';
import { authenticateUserService } from './authenticateUserService.ts';
import { ApplicationError, BadRequestError, NotFoundError } from "../../../../shared/errors/ApplicationError.ts";
import auth from "../../../../config/auth.ts";
import { expiryDateMapper } from "../../../../utils/expiryDateMapper.ts";

export const authenticateUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    password
  } = request.body;

  if (!(email && password)) {
    return next(new BadRequestError('Request body is missing information to create new user!'));
  }

  let sessionInfo;
  try {
    sessionInfo = await authenticateUserService.execute({
      email,
      password
    });
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new ApplicationError('Authenticate User: Unknown error!', 500, error as Error));
  }
   
  if (!sessionInfo) {
    throw new NotFoundError('Session fot this user was not found.');
  }
  
  // const clientIp = request.ip?.split(':')[request.ip.split(':').length - 1];
  // if (clientIp) {
  //   console.log(`\nSession started from user with Email: ${
  //     email
  //   }, using IP: ${
  //     clientIp
  //   }\nReq Headers:\n${
  //     JSON.stringify(request.headers)
  //   }`);
  // };

  const { refresh_token, token, user } = sessionInfo;
  const expireDateDays = auth.refresh_token_expires_in;
  const maxAge = expiryDateMapper(expireDateDays as string);

  response.cookie('refresh_token', refresh_token, {
    httpOnly: true,  // revents JS access
    secure: true,    // only HTTPS
    sameSite: 'strict', // avoid CSRF
    maxAge,
  });

  console.log(user);
  return response.json({
    user,
    token
  });
}