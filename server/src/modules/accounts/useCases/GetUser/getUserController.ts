import { validate } from 'npm:uuid';
import { Request, Response, NextFunction } from 'npm:@types/express';
import { getUserService } from './getUserService.ts';
import { SearchTerm } from "../../@types/index.d.ts";
import { ApplicationError, BadRequestError } from "../../../../shared/errors/ApplicationError.ts";

export const getUserController = async (request: Request, response: Response, next: NextFunction) => {
  let searchTerm = {};
  if (
    request.params.id
      && request.params.id.length > 0
      && !validate(request.params.id)
  ) throw new BadRequestError('Not a valid UUID!');
  else if (request.params.id) searchTerm = { id : request.params.id };
  else if (request.query) {
    const { email, username } = request.query;
    searchTerm = (email ? { email } : username ? { username } : null) as SearchTerm;
    if (searchTerm === null) throw new BadRequestError('No valid search term was found');
  }

  if (!searchTerm) new BadRequestError('No valid search term was found');

  let user;
  try {
    user = await getUserService.execute(searchTerm as SearchTerm); 
  } catch (error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    return next(new ApplicationError('Get User: Unknown error!', 500, error as Error));
  }
  
  return response.json(user);
}