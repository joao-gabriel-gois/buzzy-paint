import { Request, Response, NextFunction } from 'npm:@types/express';
import { updateUserService } from "@modules/accounts/useCases/UpdateUser/updateUserService.ts";
import { ApplicationError, BadRequestError } from "@shared/errors/ApplicationError.ts";

export const updateUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password
  } = request.body;
  
  if (!(email || username || firstName || lastName || password)) {
    return next(new BadRequestError('Request body is missing information to update user!'));
  }

  let updatedUser;
  try {
    updatedUser = await updateUserService.execute(request.body);
  }
  catch(error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new ApplicationError('Update User: Unknown error!', 500, error as Error));
  } 

  return response.json(updatedUser);
}