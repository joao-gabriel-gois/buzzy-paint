import { validate } from 'npm:uuid';
import { Request, Response, NextFunction } from 'npm:@types/express';
import { getUserService } from './getUserService.ts';
import { SearchTerm } from "../../@types/index.d.ts";
import { ApplicationError, BadRequestError } from "../../../../shared/errors/ApplicationError.ts";

export const getUserController = async (req: Request, res: Response, next: NextFunction) => {
  let searchTerm = {};
  if (
    req.params.id
      && req.params.id.length > 0
      && !validate(req.params.id)
  ) throw new BadRequestError('Not a valid UUID!');
  else if (req.params.id) searchTerm = { id : req.params.id };
  else if (req.query) {
    const { email, username } = req.query;
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
    return next(new Error('Get User: Unknown error!'));
  }
  
  return res.json(user);
}