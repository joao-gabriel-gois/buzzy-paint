import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { unreachable } from "jsr:@std/assert";
import { UsersRepositoryInMemory } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { CreateUserService } from "@modules/accounts/useCases/CreateUser/createUserService.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { BusinessLogicError } from "@shared/errors/ApplicationError.ts";

let usersRepository: UsersRepositoryInMemory;
let createUserService: CreateUserService;

describe('Create User Service', () => {
  beforeAll(() => {
    usersRepository = new UsersRepositoryInMemory();
    createUserService = new CreateUserService(usersRepository);        
  });

  it('should be able to create an user', async () => {
    const userRequestData: ICreateUserDTO = {
      email: 'anything@test.com',
      username: 'anyone',
      firstName: 'Joe',
      lastName: 'Doe',
      password: 'TestPwd!123_'
    };

    const newUser = await createUserService.execute(userRequestData);

    expect(newUser).toHaveProperty('id');
    expect(newUser).toHaveProperty('draws_mongo_id');
    expect(newUser).not.toHaveProperty('password');
  });

  it('should not be able to create an user using an already registered email', async () => {
    const userRequestData: ICreateUserDTO = {
      email: 'anything@test.com',
      username: 'anotherone',
      firstName: 'Joe',
      lastName: 'Doe',
      password: 'TestPwd!123_'
    };

    try {
      await createUserService.execute(userRequestData);
      unreachable("Expected BusinessLogicError for repeated email was not thrown");
    }
    catch (error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not Error");
        return;
      }
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("User with this email already exists");
    }
  });

  it('should not be able to create an user using an already registered username', async () => {
    const userRequestData: ICreateUserDTO = {
      email: 'anotherone@test.com',
      username: 'anyone',
      firstName: 'Joe',
      lastName: 'Doe',
      password: 'TestPwd!123_'
    };

    try {
      await createUserService.execute(userRequestData);
      unreachable("Expected BusinessLogicError for repeated username was not thrown");
    }
    catch (error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not Error");
        return;
      }
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("User with this username already exists");
    }
  });
});

