import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";

class UpdateUserService {
  async execute(updateUserDTO: IUpdateUserDTO): Promise<ExposableUser> {
    if (updateUserDTO.email) {;
      const hasUser = await usersRepository.findByEmail(updateUserDTO.email);
      if (hasUser) throw new BusinessLogicError('You can\'t update to an already registered email!');
    }
    
    const updatedUser = await usersRepository.update(updateUserDTO);

    const { password: _, ...exposeableUser } = updatedUser;

    return exposeableUser;
  }
}

export const updateUserService = new UpdateUserService();
