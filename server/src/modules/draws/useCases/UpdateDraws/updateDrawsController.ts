import { Response, NextFunction } from "npm:@types/express";
import { updateDrawsService } from "@modules/draws/useCases/UpdateDraws/updateDrawsService.ts";
import { BadRequestError, UnauthorizedError } from "@shared/errors/ApplicationError.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { isDrawsDTOArray } from "@modules/draws/DTOs/isDrawsDTO.ts";

export const updateDrawsController = async (request: AuthRequest, response: Response, next: NextFunction) => {
  const {
    activeIndex,
    draws,
    timestamp
  } = request.body;
  // auth route, it will always have an user id on it
  const { id } = request.user!;

  if (!(draws && !isNaN(Number(activeIndex)) && !isNaN(Number(timestamp)))) {
    return next(new BadRequestError("Data is either not present or in the wrong format!"));
  }
  else if (!isDrawsDTOArray(draws)) {
    return next(new BadRequestError("The drawing to be updated is not in the proper format!"));
  }
  else if (!id) {
    // Not tested, it should only happens if there wasn't a middleware for auth
    // Important to monitor if somehow it is reproduced and check which conditions
    // If it is actualy reproducible, we should find a way to force it to happen to
    // write unit tests for it
    return next(new UnauthorizedError("No user was found for this action!"));
  }

  try {
    await updateDrawsService(id, {activeIndex, draws, timestamp} as ITabsDTO);
  }
  catch(error) {
    return next(error);
  }

  return response.status(200).end();
}