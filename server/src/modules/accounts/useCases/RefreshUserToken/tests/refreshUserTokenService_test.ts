import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { unreachable } from "jsr:@std/assert";
import { IAuthRequest } from "../../interfaces.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { refreshUserTokenService } from "@modules/accounts/useCases/RefreshUserToken/refreshUserTokenService.ts";
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { UnauthorizedError } from "@shared/errors/ApplicationError.ts";
import { sleep } from "@utils/sleep.ts";

// we need a time gap so 'iat' (issuedAt) of jwt will be actually
// different and the new signing will not lead to the same tokens.
// This test will always fail for sleep value below 0.6 seconds.
// As in-memory repo is probably adding some 0.1 sec latency, seems
// like 'iat' requires at least one second to generate a differet token
// so for reproduceability, we will use 1 sec. This is required for the
// first test case
const JWT_IAT_REQUIRED_TIME_GAP_FOR_DIFF_TOKENS = 1;

let userRequestData: ICreateUserDTO
let user: User;

describe("Refresh Token Service", () => {
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
    usersTokensRepository.clear();
  });


  it("should be able to refresh an user token", async () => {
    const authDTO: IAuthRequest = {
      email: user.email,
      password: userRequestData.password // plain-text password
    };

    const {
      refresh_token,
      token
    } = await authenticateUserService(authDTO);
    
    await sleep(JWT_IAT_REQUIRED_TIME_GAP_FOR_DIFF_TOKENS);

    const {
      token: newToken,
      refresh_token: newRefreshToken
    } = await refreshUserTokenService(refresh_token);

    expect(refresh_token).not.toEqual(newRefreshToken);
    expect(token).not.toEqual(newToken);
  });

  it("should not be able to refresh a non existent user token", async () => {
    const non_existent_refresh_token = "I'm definetely not a valid refresh token";
    try {
      await refreshUserTokenService(non_existent_refresh_token);
      unreachable("Expected BadRequestError for Incorrect Email or Password was not thrown");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe("Refresh Token Mismatch! Token informed was not found for this user");
    }
  });
});



