import { Request, Response, NextFunction } from 'npm:@types/express';
import { updateUserService } from "@modules/accounts/useCases/UpdateUser/updateUserService.ts";
import { ApplicationError, BadRequestError } from "@shared/errors/ApplicationError.ts";
/*
  WARNING:
  Despite the fact that this was exposed by a route in the previous,
  commmits, these useCase's service, controller and modules are not being
  called on frontend yet. Before exposing it, it would be necessary
  to add proper validations in controller, better error check ups in
  the service and then, finally, really write its tests.
  After noticing this when creating unit tests, I decided to comment
  the rout that calls it until everything regarding it is not done yet
  and I've also added this comment in all it's related implementations
*/
export const updateUserController = async (request: Request, response: Response, next: NextFunction) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password
  } = request.body;
  // Need to add validations here!
  // Check current createUser Zod patterns to do so
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