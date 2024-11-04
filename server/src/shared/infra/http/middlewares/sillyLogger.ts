import { Request, Response, NextFunction } from 'npm:@types/express';

export const sillyLogger = (request: Request, _: Response, next: NextFunction) => {
  console.log(
    `\n${request.method} request made to ${request.path}, by ${request.hostname}`
  );
  if (Object.keys(request.query).length !== 0) {
    console.log('\twith query', request.query);
  }
  next();
}