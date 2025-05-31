import { Server } from "node:http";
import { app } from "@shared/infra/http/app.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect/expect";
import { createApi, Api } from "@utils/sosotest.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { createDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { isDrawsDTOArray } from "@modules/draws/DTOs/isDrawsDTO.ts";
import { tabsDTOTestSample } from "@modules/draws/useCases/tabsDTOTestSample.ts";

const PORT = 3456;
const isDrawCreated = () => {
  return !!user?.draws_mongo_id;
};
const drawsRequestData: ITabsDTO = tabsDTOTestSample;
let userRequestData: ICreateUserDTO;

let server: Server;
let user: ManageableUser;
let api: Api;
let token: string;


describe('Get Draw Controller', () => {
  beforeAll(async () => {
    server = app.listen(PORT);
    api = createApi("127.0.0.1", PORT);

    userRequestData = {
      email: "get-draw@test.com",
      username: "testuser",
      firstName: "GET draws",
      lastName: "User",
      password: "GetDrawsPsswd!123_"
    };
    
    user = await usersRepository.create(userRequestData) as ManageableUser;

    const sessionInfo = await authenticateUserService({
      email: userRequestData.email,
      password: userRequestData.password,
    });
    
    token = sessionInfo.token;
  });

  afterAll(() => {
    usersRepository.clear();
    usersTokensRepository.clear();
    
    if (server) server.close();
  });

  it('GET /draws: should be able to fetch draws even before actually create them', async () => {
    const response = await api.get('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send()
    
    if (isDrawCreated()) {
      throw new Error('This test should run before creating a draw!');
    }
    // console.log(response.body)
    expect(response.status).toBe(200);
    expect(response.body?.user_id).toBeDefined();
    expect(response.body?.user_id).toEqual(user.id);
    expect(response.body?.data).toBeDefined();
    expect(response.body?.data).toBeNull();
  });

  it('GET /draws: should be able to fetch all draws after creating them', async () => {
    await createDrawsService(user.id, drawsRequestData);
    const response = await api.get('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(response.status).toBe(200);
    expect(response.body?.user_id).toBeDefined();
    expect(response.body?.data).toBeDefined();
    expect(response.body?.data).toEqual(
      expect.objectContaining({
        activeIndex: 2,
        timestamp: 1742528390012
      })
    )
    // @ts-ignore (TODO): sosotest need to change to generics impl to avoid unknown mismatch
    expect(isDrawsDTOArray(response.body?.data?.draws)).toBe(true);
  });
  
  it('GET /draws: should not be able to fetch all draws without auth headers', async () => {
    const response = await api.get('/draws').send();
    
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error:  {
          name: "Unauthorized",
          message: "Authorization Header not Found!"
        }
      }),
    );
  });

  it('GET /draws: should not be able to fetch all draws with invalid auth headers', async () => {
    const response = await api.get('/draws')
      .set('Authorization', 'Bearer Invalid-T0ken!')
      .send()
    
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error:  {
          name: "Unauthorized",
          message: "Invalid Token!"
        }
      }),
    );
  });

});
