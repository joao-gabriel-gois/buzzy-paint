import { Response, NextFunction } from 'npm:@types/express';
import { UnauthorizedError } from "@shared/errors/ApplicationError.ts";
import { verify } from "npm:jsonwebtoken";
import auth from "@config/auth.ts";

interface IPayload {
  sub: string;
}

export const ensureAuthentication = (request: IRequest, _: Response, next: NextFunction) => {
  const bearer = request.headers.authorization;
  if (!bearer) next(new UnauthorizedError('Authorization Header not Found!'))
  else {
    const token = bearer.split(' ')[1];
    
    try {
      const { sub: user_id } = verify(
        token,
        auth.token_secret
      ) as IPayload;
  
      request.user = {
        id: user_id
      };
  
      next();
    } catch (error) {
      next(new UnauthorizedError('Invalid Token!', 401, error as Error));
    }
  }
}