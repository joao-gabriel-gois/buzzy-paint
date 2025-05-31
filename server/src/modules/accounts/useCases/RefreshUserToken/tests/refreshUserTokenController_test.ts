import { Server } from "node:http";
import { app } from "@shared/infra/http/app.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { expect } from "jsr:@std/expect/expect";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { createApi, Api } from "@utils/sosotest.ts";
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { User } from "@modules/accounts/models/User.ts";
import { sleep } from "@utils/sleep.ts";
import { fail } from "@std/assert/fail";

const JWT_IAT_REQUIRED_TIME_GAP_FOR_DIFF_TOKENS = 1;
const PORT = 3456;
let userRequestData: ICreateUserDTO;
let server: Server;
let api: Api;
let validRefreshToken: string;

describe('Refresh User Token Controller', () => {
  beforeAll(async () => {
    server = app.listen(PORT);
    api = createApi("127.0.0.1", PORT);

    userRequestData = {
      email: "refresh-session@test.com",
      username: "refreshuser",
      firstName: "Refresh",
      lastName: "User",
      password: "RefreshPsswd!123_"
    };
    
    await usersRepository.create(userRequestData) as User;

    const sessionInfo = await authenticateUserService({
      email: userRequestData.email,
      password: userRequestData.password,
    });
    
    validRefreshToken = sessionInfo.refresh_token;
    // one second diff to avoid the new token coming from 
    // future refresh-session calls to not become the same
    // due to same `IssuedAt` value as input
    await sleep(JWT_IAT_REQUIRED_TIME_GAP_FOR_DIFF_TOKENS);
  });

  afterAll(() => {
    usersRepository.clear();
    usersTokensRepository.clear();
    
    if (server) {
      server.close();
    }
  });


  it('POST /refresh-session: should be able to refresh user token with valid refresh token', async () => {
    const response = await api
      .post("/refresh-session")
      .set('Cookie', [`refresh_token=${validRefreshToken}`])
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');


    const setCookieHeader = response.headers ? response.headers['set-cookie'] : null;
    if (!setCookieHeader) {
      return fail('setCookieHeader is undefined!');
    }
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader[0]).toContain('refresh_token=');
    
    const newRefreshToken = setCookieHeader[0].split('refresh_token=')[1].split(';')[0];
    expect(newRefreshToken).not.toBe(validRefreshToken);
  });


  it('POST /refresh-session: should not be able to refresh token without a refresh token cookie', async () => {
    const response = await api
      .post("/refresh-session")
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Refresh token doesn't exists for this user. User will need to login again!",
        }
      }),
    );
  });


  it('POST /refresh-session: should not be able to refresh token with invalid refresh token', async () => {
    const response = await api
      .post("/refresh-session")
      .set('Cookie', ['refresh_token=invalid-refresh-session-value'])
      .send();

    expect(response.status).toBe(401);
    expect(response.body?.error).toBeDefined();
  });

  // Test expired refresh token
  it('POST /refresh-session: should not be able to refresh token with expired refresh token', async () => {
    const sessionInfo = await authenticateUserService({
      email: userRequestData.email,
      password: userRequestData.password,
    });
    
    const tokenToExpire = sessionInfo.refresh_token;
    
    // expiresIn of refresh_token under `test` ENV is 3 second forcing expiration
    // to test this scenario with sleep. It is important to be more than 1s because
    // the test setup already awaits for 1s to validate different iat scenarios.
    // I choose 3s because of the fake async services that adds 100ms after called,
    // specially for other tests that needed valid refresh_token, like the service one.
    await sleep(3);
    
    const response = await api
      .post("/refresh-session")
      .set('Cookie', [`refresh_token=${tokenToExpire}`])
      .send();


    expect(response.status).toBe(401);
    expect(response.body?.error).toBeDefined();
  });
});
