import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { usersRepository as prodUsersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { usersRepository as testUsersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";


const ENV = Deno.env.get('ENV');

const usersRepository = ENV === 'test' ? testUsersRepository : prodUsersRepository;

export async function createUserService({
  email,
  username,
  firstName,
  lastName,
  password
}: ICreateUserDTO): Promise<ExposableUser> {
  let existentUser = await usersRepository.findByEmail(email);
  if (existentUser) throw new BusinessLogicError("User with this email already exists");
  existentUser = await usersRepository.findByUsername(username);
  if (existentUser) throw new BusinessLogicError("User with this username already exists");

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
