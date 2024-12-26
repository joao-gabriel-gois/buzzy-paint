import { Request, Response, NextFunction } from 'npm:@types/express';
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { ApplicationError, BadRequestError, InvalidParameterError, NotFoundError, ValidationError } from "@shared/errors/ApplicationError.ts";
import auth from '@config/auth.ts';
import { expiryDateMapper } from "@utils/expiryDateMapper.ts";
import * as zod from 'npm:zod';

export const authenticateUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    password
  } = request.body;

  if (!(email && password)) {
    return next(new BadRequestError('Request body is missing information to authenticate this user!'));
  }

  const passwordRuleString = '^(?=.*[A-Z])'
    + '(?=.*[a-z])'
    + '(?=.*\\d)'
    + '(?=.*[!@#$%^&*()_+\\-=[\\]{};\'":\\\\|,.<>\\/?])'
    + '.*$';
  const passwordRule = new RegExp(passwordRuleString);

  const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod
      .string()
      .min(10, { message: 'The password must have at least 10 characters.'})
      .regex(passwordRule, {
        message: 'The password must have at least one uppercased character'
        + ', one lowercased one, a number and a special character.'
      })
  });

  const inputValidation = loginSchema.safeParse(request.body);
  if (!inputValidation.success) {
    const message = 'There is one or more input validation errors';
    return next(new ValidationError(message, 400, inputValidation.error));
  }

  const { refresh_token_expires_in } = auth;
  if (!refresh_token_expires_in) {
    // yeah, it should crash in this case
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
      return next(error);
    }
    return next(new ApplicationError('Authenticate User: Unknown error!', 500, error as Error));
  }
  
  if (!sessionInfo) {
    return next(new NotFoundError('Session for this user was not found.'));
  }
  
  const { refresh_token, token, user } = sessionInfo;
  const maxAge = expiryDateMapper(refresh_token_expires_in!)// / 1000;
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