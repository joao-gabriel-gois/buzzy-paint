import { Request, Response, NextFunction } from 'npm:@types/express';
import { createUserService } from "@modules/accounts/useCases/CreateUser/createUserService.ts";
import { ApplicationError, BadRequestError } from "@shared/errors/ApplicationError.ts";

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