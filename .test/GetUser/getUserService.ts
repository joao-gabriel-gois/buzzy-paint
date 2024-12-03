import { NotFoundError } from "../../server/src/shared/errors/ApplicationError.ts";
import { ExposableUser, SearchTerm } from "../../server/src/modules/accounts/@types/index.js";
// import { usersRepository } from "../../repositories/in-memory/usersRepository.ts";
import { usersRepository } from "../../server/src/modules/accounts/repositories/postgres/usersRepository.ts";


class GetUserService {
  async execute(userSearchTerm: SearchTerm): Promise<ExposableUser> {
    let user;

    if ('id' in userSearchTerm) {
      user = await usersRepository.getUserById(userSearchTerm.id);
    }
    else if ('email' in userSearchTerm) {
      user = await usersRepository.getUserByEmail(userSearchTerm.email);
    }
    else if ('username' in userSearchTerm) {
      user = await usersRepository.getUserByUsername(userSearchTerm.username);
    }

    if (!user) {
      throw new NotFoundError('No user was found for any of the search terms provided!');
    }

    delete user.password;

    return user;
  }
}

export const getUserService = new GetUserService();
