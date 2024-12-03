import { Response, NextFunction } from 'npm:@types/express';
import { updateDrawsService } from "@modules/draws/useCases/UpdateDraws/updateDrawsService.ts";
import { BadRequestError, UnauthorizedError } from "@shared/errors/ApplicationError.ts";

export const updateDrawsController = async (request: AuthRequest, response: Response, next: NextFunction) => {
  const {
    draws
  } = request.body;
  // auth route, it will always have an user id on it
  const { id } = request.user!;

  if (!draws) {
    return next(new BadRequestError('Data is either not present or in the wrong format!'));
  }
  // type / data validation below:
  // if(!isDrawDTO(draws)) {
  //   throw new BadRequestError('Draws are not in the proper format!');
  // }
  else if (!id) {
    return next(new UnauthorizedError('No user was found for this action!'));
  }

  try {
    await updateDrawsService.execute(id, draws);
  }
  catch(error) {
    return next(error);
  }

  return response.status(200).end();
}