import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";

class CreateUserService {
  async execute({email, username, firstName, lastName, password }: ICreateUserDTO): Promise<ExposableUser> {
    // check if either user with same email or username already exists (business rule)
    let existentUser = await usersRepository.findByEmail(email);
    if (existentUser) throw new BusinessLogicError('User with this email already exists');
    existentUser = await usersRepository.findByUsername(username);
    if (existentUser) throw new BusinessLogicError('User with this username already exists');

    const createdUser = await usersRepository.create({
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
