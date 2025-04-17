import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { unreachable } from "jsr:@std/assert";
import { IAuthRequest, IAuthResponse } from "@modules/accounts/useCases/interfaces.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { BadRequestError, BusinessLogicError } from "@shared/errors/ApplicationError.ts";

let userRequestData: ICreateUserDTO
let user: User;

describe("Authenticate User Service", () => {
  beforeAll(async () => {
    userRequestData = {
      email: "anything@test.com",
      username: "anyone",
      firstName: "Joe",
      lastName: "Doe",
      password: "TestPsswd!123_"
    };
    user = await usersRepository.create(userRequestData) as User;
  });

  afterAll(() => {
    usersRepository.clear();
  });
  

  it("should be able to authenticate an user", async () => {
    const authDTO: IAuthRequest = {
      email: user.email,
      password: userRequestData.password // plain-text password
    };

    const authResponse: IAuthResponse = await authenticateUserService(authDTO);

    expect(authResponse).toHaveProperty("token");
    expect(authResponse).toHaveProperty("refresh_token");
    expect(authResponse).toHaveProperty("user");
    expect(user.email).toEqual(authResponse.user.email);
    expect(user.username).toEqual(authResponse.user.username);
    expect(user.firstname).toEqual(authResponse.user.firstName);
    expect(user.lastname).toEqual(authResponse.user.lastName);
  });

  it("should not be able to authenticate a non-existent user", async () => {
    const authDTO: IAuthRequest = {
      email: "non_existent@email.com",
      password: userRequestData.password // plain-text password
    };

    try {
      await authenticateUserService(authDTO);
      unreachable("Expected BadRequestError for Incorrect Email or Password was not thrown");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe("Incorrect Email or password!");
    }
  });

  it("should not be able to authenticate when the password is wrong", async () => {
    const authDTO: IAuthRequest = {
      email: user.email,
      password: "ImStillNotHere!123!"
    };

    try {
      await authenticateUserService(authDTO);
      unreachable("Expected BussinessLogicError for Incorrect Email or Password was not thrown");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not Error");
        return;
      }
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("Incorrect Email or password!");
    }
  });
});

