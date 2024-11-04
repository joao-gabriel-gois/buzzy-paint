import { BusinessLogicError } from "../../../../shared/errors/ApplicationError.ts";
// import { usersRepository } from "../../repositories/in-memory/usersRepository.ts";
import { usersRepository } from "../../repositories/postgres/usersRepository.ts";

import { ExposableUser } from "../../@types/index.d.ts";
import { ICreateUserDTO } from "../../DTOs/CreateUserDTO.ts";

class CreateUserService {
  async execute({email, username, firstName, lastName, password }: ICreateUserDTO): Promise<ExposableUser> {
    // check if either user with same email or username already exists (business rule)
    let existentUser = await usersRepository.getUserByEmail(email);
    if (existentUser) throw new BusinessLogicError('User with this email already exists');
    existentUser = await usersRepository.getUserByUsername(username);
    if (existentUser) throw new BusinessLogicError('User with this username already exists');

    const createdUser = await usersRepository.createUser({
      email,
      username,
      firstName,
      lastName,
      password
    });

    delete createdUser.password;

    return createdUser;
  }
}

export const createUserService = new CreateUserService();
