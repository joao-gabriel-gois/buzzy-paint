import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { unreachable } from "jsr:@std/assert";
import { UsersRepositoryInMemory } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { UsersTokensRepositoryInMemory } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { AuthenticateUserService, IAuthRequest } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { User } from "@modules/accounts/models/User.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { RefreshTokenService } from "@modules/accounts/useCases/RefreshUserToken/refreshUserTokenService.ts";
import { sleep } from "@utils/sleep.ts";
import { NotFoundError } from "@shared/errors/ApplicationError.ts";

let usersRepository: UsersRepositoryInMemory;
let usersTokensRepository: UsersTokensRepositoryInMemory;
let authenticateUserService: AuthenticateUserService;
let refreshTokenService: RefreshTokenService;
let userRequestData: ICreateUserDTO
let user: User;

describe('Refresh Token Service', () => {
  beforeAll(async () => {
    usersRepository = new UsersRepositoryInMemory();
    usersTokensRepository = new UsersTokensRepositoryInMemory();
    userRequestData = {
      email: 'anything@test.com',
      username: 'anyone',
      firstName: 'Joe',
      lastName: 'Doe',
      password: 'TestPsswd!123_'
    };
    user = await usersRepository.create(userRequestData) as User;
    authenticateUserService = new AuthenticateUserService(usersTokensRepository, usersRepository);
    refreshTokenService = new RefreshTokenService(usersTokensRepository);
  });

  it('should be able to refresh an user token', async () => {
    const authDTO: IAuthRequest = {
      email: user.email,
      password: userRequestData.password // plain-text password
    };

    const {
      refresh_token,
      token
    } = await authenticateUserService.execute(authDTO);
    
    // we need a time gap so iat (issuedAt) of jwt will be actually
    // different and the new signing will not lead to the same tokens.
    // This test will always fail for sleep value below 0.6 seconds.
    await sleep(0.8);

    const {
      token: newToken,
      refresh_token: newRefreshToken
    } = await refreshTokenService.execute(refresh_token);

    expect(refresh_token).not.toEqual(newRefreshToken);
    expect(token).not.toEqual(newToken);
  });

  it('should not be able to refresh a non existent user token', async () => {
    const non_existent_refresh_token = "I'm definetely not a valid refresh token";
    try {
      await refreshTokenService.execute(non_existent_refresh_token);
      unreachable("Expected BadRequestError for Incorrect Email or Password was not thrown");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Refresh Token Mismatch! Token informed was not found for this user");
    }
  });
});



