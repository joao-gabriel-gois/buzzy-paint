import { Request, Response, NextFunction } from "npm:@types/express";

const now = () => {
  const d = new Date();
  return `${d.getHours()}:${
    String(d.getMinutes()).padStart(2, "0")
  }:${
    String(d.getSeconds()).padStart(2, "0")
  }`;
}

export const sillyLogger = (request: Request, _: Response, next: NextFunction) => {
  console.log(
    `\n[${now()}]:${request.method} request made to ${request.path}, by ${request.hostname}`
  );
  if (Object.keys(request.query).length !== 0) {
    console.log("\twith query", request.query);
  }
  next();
}