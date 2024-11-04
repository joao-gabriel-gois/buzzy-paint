class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    super.name = "Application Error";
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

class BadRequestError extends ApplicationError {
  constructor(message = 'Bad Request') {
    super(message, 400);
    super.name = "Bad Request";
  }
}

class BusinessLogicError extends ApplicationError {
  constructor(message = 'Business Logic Error') {
    super(message, 422);
    super.name = "Business Logic Error";
  }
}

class DatabaseTransactionError extends ApplicationError {
  constructor(message = 'Query has failed!') {
    super(message, 503);
    super.name = "Database Transaction Error";
  }
}

class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    super.name = 'Unauthorized';
  }
}

class NotFoundError extends ApplicationError {
  constructor(message = 'Not Found') {
    super(message, 404);
    super.name = 'Not Found';
  }
}

export {
  ApplicationError,
  BusinessLogicError,
  BadRequestError,
  DatabaseTransactionError,
  UnauthorizedError,
  NotFoundError
}