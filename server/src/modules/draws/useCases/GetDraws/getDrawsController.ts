import { Response, NextFunction } from 'npm:@types/express';
import { UnauthorizedError } from "@shared/errors/ApplicationError.ts";
import { getDrawsService } from "@modules/draws/useCases/GetDraws/getDrawsService.ts";


export const getDrawsController = async (request: AuthRequest, response: Response, next: NextFunction) => {
  const { id } = request.user!;
  if (!id) {
    return next(new UnauthorizedError('No user was found for this action!'));
  }
  let draws;
  try {
    draws = await getDrawsService.execute(id);
  }
  catch(error) {
    return next(error);
  }

  return response.json({ draws });
}