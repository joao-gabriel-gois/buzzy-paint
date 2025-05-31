import { Server } from "node:http";
import { app } from "@shared/infra/http/app.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect/expect";
import { createApi, Api } from "@utils/sosotest.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/in-memory/usersTokensRepository.ts";
import { authenticateUserService } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserService.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { tabsDTOTestSample } from "@modules/draws/useCases/tabsDTOTestSample.ts";

const PORT = 3456;
let server: Server;
let user: ManageableUser;
let api: Api;
let token: string;

const drawsRequestData: ITabsDTO = tabsDTOTestSample;
let userRequestData: ICreateUserDTO;

describe('Create Draw Controller', () => {
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


  it('POST /draws: should be able to create a draw', async () => {
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(drawsRequestData)
    // in case this test faile, uncomment this line can bring details about the error
    // console.log(response.body)
    expect(response.status).toBe(201);
  });
  
  // Failure scenarios below, keep like that
  // Test bellow will throw an error if it is executed before the previous one ('should be able to create a draw')
  it('POST /draws: should not be able to create a draw if user already have one', async () => {
    const { draws_mongo_id } = user;
    if (draws_mongo_id === null) {
      throw new Error(
        'This test is running before the succesful creation of a draw, put it after it in order to make it work.'
      );
    }
    await usersRepository.update({
      id: user.id,
      draws_mongo_id: 'fake-already-existent-draw-id'
    })
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(drawsRequestData)

    expect(response.status).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Business Logic Error",
          message: "(CreateDrawService): This user already has an assigned Draw.",
        }
      }),
    );
    // recovering user's draws_mongo_id in order to not mess up the state after this test
    await usersRepository.update({
      id: user.id,
      draws_mongo_id
    })
  });

  it('POST /draws: should not be able to create a draw without a token header', async () => {
    const response = await api.post('/draws')
      .send(drawsRequestData)

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

  it('POST /draws: should not be able to create a draw with an invalid token header', async () => {
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

  it('POST /draws: should not be able to create a draw if the draws are not in the valid schema', async () => {
    const invalidDrawsRequestData = {
      ...drawsRequestData,
      draws: [
        {
          tabName: "Tab 1",
          undoStack: [],
          eventQueue: [
            {
              type: "DRAW",
              sequence: [[465, 229], ["228", true]], // invalid
              style: {
                drawLineWidth: "20",
                drawColor: null
              }
            },
          ],
        },
      ],
    }
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "The drawing to be saved is not in the proper format!",
        }
      }),
    );
  });

  it('POST /draws: should not be able to create a draw if `draws` is not a IDrawDTO[]', async () => {
    const invalidDrawsRequestData = {
      ...drawsRequestData,
      draws: null
    }
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Data is either not present or in the wrong format!",
        }
      }),
    );
  });

  it('POST /draws: should not be able to create a draw if activeIndex or timestamp are undefined', async () => {
    const invalidDrawsRequestData = {
      draws: drawsRequestData.draws
    }
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Data is either not present or in the wrong format!",
        }
      }),
    );
  });

  it('POST /draws: should not be able to create a draw if activeIndex is NaN', async () => {
    const invalidDrawsRequestData = {
      ...drawsRequestData,
      activeIndex: ":)"
    }
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Data is either not present or in the wrong format!",
        }
      }),
    );
  });

  it('POST /draws: should not be able to create a draw if timestamp is NaN', async () => {
    const invalidDrawsRequestData = {
      ...drawsRequestData,
      timestamp: ":)"
    }
    const response = await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Data is either not present or in the wrong format!",
        }
      }),
    );
  });

});
