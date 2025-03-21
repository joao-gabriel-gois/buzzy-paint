import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";

// class is exportable only for unit tests.
// Do not import it anywhere else.
export class CreateUserService {
  private usersRepository: IUsersRepository;
  constructor(usersRepository: IUsersRepository) {
    this.usersRepository = usersRepository;
  }

  async execute({email, username, firstName, lastName, password }: ICreateUserDTO): Promise<ExposableUser> {
    // check if either user with same email or username already exists (business rule)
    let existentUser = await this.usersRepository.findByEmail(email);
    if (existentUser) throw new BusinessLogicError('User with this email already exists');
    existentUser = await this.usersRepository.findByUsername(username);
    if (existentUser) throw new BusinessLogicError('User with this username already exists');

    const createdUser = await this.usersRepository.create({
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

// The application should always import this instance bellow
// to keep a singleton reference to the service.
export const createUserService = new CreateUserService(usersRepository);
