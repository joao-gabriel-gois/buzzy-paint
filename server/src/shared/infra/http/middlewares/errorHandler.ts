import { ApplicationError } from "@shared/errors/ApplicationError.ts";
import { Request, Response, NextFunction} from 'npm:@types/express';

export const errorHandler = (error: Error, _: Request, response: Response, _next: NextFunction) => {
  if (!(error instanceof ApplicationError)) {
    console.log('Unknown error:', error);
    return response.status(500).json({
      error: {
        message: 'Internal Server Error',
      },
    });
  }
  
  return response.status(error.statusCode).json({
    error: {
      name: error.name,
      message: error.message,
    },
  });
}