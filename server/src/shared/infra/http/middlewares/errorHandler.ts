import { ApplicationError } from "../../../errors/ApplicationError.ts";
import { Request, Response, NextFunction} from 'npm:@types/express';

export const errorHandler = (err: Error, _: Request, res: Response, _next: NextFunction) => {
  if (!(err instanceof ApplicationError)) {
    console.error(`[\x1b[2;3;36m${new Date().toISOString()}\x1b[m] \x1b[1;31mUnexpected Error:\x1b[1;31m`, err);
    return res.status(500).json({
      error: {
        message: 'Internal Server Error',
      },
    });
  }
  
  console.error(`[\x1b[2;3;36m${new Date().toISOString()}\x1b[m] \x1b[1;31m${err.name}\x1b[m: ${err.message}`);
  return res.status(err.statusCode).json({
    error: {
      name: err.name,
      message: err.message,
    },
  });
}