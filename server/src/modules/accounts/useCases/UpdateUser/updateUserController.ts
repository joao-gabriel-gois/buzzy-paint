import { Request, Response, NextFunction } from 'npm:@types/express';
import { updateUserService } from './updateUserService.ts';
import { ApplicationError, BadRequestError } from "../../../../shared/errors/ApplicationError.ts";

export const updateUserController = async (req: Request, res: Response, next: NextFunction) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password
  } = req.body;
  
  if (!(email || username || firstName || lastName || password)) {
    return next(new BadRequestError('Request body is missing information to update user!'));
  }

  let updatedUser;
  try {
    updatedUser = await updateUserService.execute(req.body);
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new Error('Update User: Unknown error!'));
  } 

  return res.json(updatedUser);
}