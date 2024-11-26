import { IUpdateUserDTO } from "../../DTOs/UpdateUserDTO.ts";
// import { usersRepository } from "../../repositories/in-memory/usersRepository.ts";
import { usersRepository } from "../../repositories/postgres/usersRepository.ts";
import { ExposableUser } from "../../@types/index.d.ts";
import { BusinessLogicError } from "../../../../shared/errors/ApplicationError.ts";

class UpdateUserService {
  async execute(updateUserDTO: IUpdateUserDTO): Promise<ExposableUser> {
    if (updateUserDTO.email) {;
      const hasUser = await usersRepository.getUserByEmail(updateUserDTO.email);
      if (hasUser) throw new BusinessLogicError('You can\'t update to an already registered email!');
    }
    
    const updatedUser = await usersRepository.updateUser(updateUserDTO);

    const { password: _, ...exposeableUser } = updatedUser;

    return exposeableUser;
  }
}

export const updateUserService = new UpdateUserService();
