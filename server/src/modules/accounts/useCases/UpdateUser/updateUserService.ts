import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";
/*
  WARNING:
  Despite the fact that this was exposed by a route in the previous,
  commmits, these useCase"s service, controller and modules are not being
  called on frontend yet. Before exposing it, it would be necessary
  to add proper validations in controller, better error check ups in
  the service and then, finally, really write its tests.
  After noticing this when creating unit tests, I decided to comment
  the rout that calls it until everything regarding it is not done yet
  and I"ve also added this comment in all it"s related implementations
*/

// class is exportable only for unit tests.
// Do not import it anywhere else to keep all
// services as singletons.
export class UpdateUserService {
  async execute(updateUserDTO: IUpdateUserDTO): Promise<ExposableUser> {
    if (updateUserDTO.email) {
      const hasUser = await usersRepository.findByEmail(updateUserDTO.email);
      if (hasUser) throw new BusinessLogicError("You can"t update to an already registered email!");
    }
    
    const updatedUser = await usersRepository.update(updateUserDTO);

    const { password: _, ...exposeableUser } = updatedUser;

    return exposeableUser;
  }
}

export const updateUserService = new UpdateUserService();
