import { Response, NextFunction } from "npm:@types/express";
import { createDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { BadRequestError, UnauthorizedError } from "@shared/errors/ApplicationError.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { isDrawsDTOArray } from "@modules/draws/DTOs/isDrawsDTO.ts"

export const createDrawsController = async (request: AuthRequest, response: Response, next: NextFunction) => {
  const {
    draws,
    activeIndex,
    timestamp
  } = request.body;
  // auth route, it should always have an user id on it
  const { id } = request.user!;
  
  if (!(draws && !isNaN(Number(activeIndex)) && !isNaN(Number(timestamp)))) {
    return next(new BadRequestError("Data is either not present or in the wrong format!"));
  }
  else if (!isDrawsDTOArray(draws)) {
    return next(new BadRequestError("The drawing to be saved are not in the proper format!"));
  }
  else if (!id) {
    return next(new UnauthorizedError("No user was found for this action!"));
  }

  try {
    await createDrawsService.execute(id, { draws, activeIndex, timestamp } as ITabsDTO);
  }
  catch (error) {
    return next(error);
  }

  return response.status(201).end();
}