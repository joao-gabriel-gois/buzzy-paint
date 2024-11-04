import { Request, Response, NextFunction } from 'npm:@types/express';
import { createUserService } from './createUserService.ts';
import { ApplicationError, BadRequestError } from "../../../../shared/errors/ApplicationError.ts";

export const createUserController = async (req: Request, res: Response, next: NextFunction) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password
  } = req.body;

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
    return next(new Error('Create User: Unknown error!'));
  } 

  return res.json(newUser);
}