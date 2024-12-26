import { Request, Response, NextFunction } from 'npm:@types/express';
import { createUserService } from "@modules/accounts/useCases/CreateUser/createUserService.ts";
import { ApplicationError, BadRequestError, ValidationError } from "@shared/errors/ApplicationError.ts";
import * as zod from 'npm:zod';

export const createUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password
  } = request.body;

  if (!(email && username && firstName && lastName && password)) {
    return next(new BadRequestError('Request body is missing information to create new user!'));
  }

  const usernameRule = new RegExp(
    '^[a-zA-Z0-9._%+-]{4,12}$',
  );
  const passwordRuleString = '^(?=.*[A-Z])'
    + '(?=.*[a-z])'
    + '(?=.*\\d)'
    + '(?=.*[!@#$%^&*()_+\\-=[\\]{};\'":\\\\|,.<>\\/?])'
    + '.*$';
  const passwordRule = new RegExp(passwordRuleString);


  const singupSchema = zod.object({
    email: zod.string().email(),
    username: zod.string()
      .min(4, { message: "Username must have at least 4 characters"})
      .max(12, { message: "Username can't have more than 12 characters"})
      .regex(usernameRule, {
        message: "Username must only accepts letter, numbers and the"
          + "following special characters: ., _, %, + or -"
      }),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
      .min(10, { message: 'The password must have at least 10 characters.'})
      .regex(passwordRule, {
        message: 'The password must have at least one uppercased character'
        + ', one lowercased one, a number and a special character.'
      })
  });

  const inputValidation = singupSchema.safeParse(request.body);
  if (!inputValidation.success) {
    const message = 'There is one or more input validation errors';
    return next(new ValidationError(message, 400, inputValidation.error));
  }

  let newUser;
  try {
    newUser = await createUserService.execute({
      email,
      username,
      firstName,
      lastName,
      password
    });
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new ApplicationError('Create User: Unknown error!', 500, error as Error));
  } 

  return response.json(newUser);
}