import { ValidationError } from "@shared/errors/ApplicationError.ts";
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
  else if (error instanceof ValidationError) {
    const { issues } = error.error;
    const issueDetails = issues.map(issue => ({ message: issue.message, path: issue.path[0]}));

    return response.status(error.statusCode).json({
      error: {
        name: error.name,
        message: error.message,
        issues: issueDetails,
      }
    })
  }
  
  return response.status(error.statusCode).json({
    error: {
      name: error.name,
      message: error.message,
    },
  });
}