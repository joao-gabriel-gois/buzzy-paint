import * as zod from 'npm:zod';

class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, error?: Error, isOperational = true) {
    super(message);
    super.name = "Application Error";
    Object.setPrototypeOf(this, new.target.prototype); 
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
    console.error(
      `[\x1b[2;3;36m${
        new Date().toISOString()
      }\x1b[m] \x1b[1;31m(${this.name}): ${
        this.message
      }\x1b[1;31m\n`,
      error
    );
  }
}

class BadRequestError extends ApplicationError {
  constructor(message = 'Bad Request', status = 400, error?: Error) {
    super(message, status, error);
    super.name = "Bad Request";
  }
}

class ValidationError extends ApplicationError {
  public error;
  constructor(message = "Invalid Input", status = 400, error: zod.ZodError) {
    super(message, status, error);
    super.name = 'Validation Error';
    this.error = error;
  }
}

class BusinessLogicError extends ApplicationError {
  constructor(message = 'Business Logic Error', status = 422, error?: Error) {
    super(message, status, error);
    super.name = "Business Logic Error";
  }
}

class DatabaseTransactionError extends ApplicationError {
  constructor(message = 'Query has failed!', status = 503, error?: Error) {
    super(message, status, error);
    super.name = "Database Transaction Error";
  }
}

class InvalidParameterError extends ApplicationError {
  constructor(message = "Unexpected Parameter Format", status = 500, error?: Error) {
    super(message, status, error);
    super.name = "Invalid Parameter Error";
  }
}

class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized', status = 401, error?: Error) {
    super(message, status, error);
    super.name = 'Unauthorized';
  }
}

class NotFoundError extends ApplicationError {
  constructor(message = 'Not Found', status = 404, error?: Error) {
    super(message, status, error);
    super.name = 'Not Found';
  }
}

export {
  ApplicationError,
  BusinessLogicError,
  BadRequestError,
  ValidationError,
  DatabaseTransactionError,
  InvalidParameterError,
  UnauthorizedError,
  NotFoundError
}