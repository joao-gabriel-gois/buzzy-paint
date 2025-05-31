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
import { tabsDTOTestSample, tabsDTOTestSampleUpdate } from "@modules/draws/useCases/tabsDTOTestSample.ts";

const PORT = 3456;
let server: Server;
let api: Api;
let token: string;

const createDrawsRequestData: ITabsDTO = tabsDTOTestSample;
const updateDrawsRequestData: ITabsDTO = tabsDTOTestSampleUpdate;
let userRequestData: ICreateUserDTO;

describe('Update Draw Controller', () => {
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
    
    await usersRepository.create(userRequestData) as ManageableUser;

    const sessionInfo = await authenticateUserService({
      email: userRequestData.email,
      password: userRequestData.password,
    });
    
    token = sessionInfo.token;
  });

  afterAll(() => {
    usersRepository.clear();
    usersTokensRepository.clear();
    
    if (server) {
      server.close();
    }
  });

  
  // ⚠️ a) this should be the first test always, once it tests an `update` before any `create`
  it('PUT /draws: should not be able to update a draw if user doesn\'t have one yet', async () => {
    const response = await api.put('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(updateDrawsRequestData)

    expect(response.status).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Business Logic Error",
          message: "(UpdateDrawService): This user doesn't have an assigned Draw.",
        }
      }),
    );
  });

  it('PUT /draws: should be able to update a draw', async () => {
    // ⚠️ b) creating a draw to update it later, finally, after previous test already
    //       happened and, from now on, it will be already created and updated, but
    //       all tests after this one will be testing errors, so it's ok.
    await api.post('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(createDrawsRequestData)

    const response = await api.put('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(updateDrawsRequestData)

    expect(response.status).toBe(200);
  });

  // Failure scenarios from now on
  it('PUT /draws: should not be able to update a draw without a token header', async () => {
    const response = await api.put('/draws')
      .send(updateDrawsRequestData)

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

  it('PUT /draws: should not be able to update a draw with an invalid token header', async () => {
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

  it('PUT /draws: should not be able to update a draw if the draws are not in the valid schema', async () => {
    const invalidDrawsRequestData = {
      ...updateDrawsRequestData,
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

    const response = await api.put('/draws')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDrawsRequestData)

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "The drawing to be updated is not in the proper format!",
        }
      }),
    );
  });

  it('PUT /draws: should not be able to update a draw if `draws` is not a IDrawDTO[]', async () => {
    const invalidDrawsRequestData = {
      ...updateDrawsRequestData,
      draws: null
    }

    const response = await api.put('/draws')
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

  it('PUT /draws: should not be able to update a draw if activeIndex or timestamp are undefined', async () => {
    const invalidDrawsRequestData = {
      draws: updateDrawsRequestData.draws
    }

    const response = await api.put('/draws')
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

  it('PUT /draws: should not be able to update a draw if activeIndex is NaN', async () => {
    const invalidDrawsRequestData = {
      ...updateDrawsRequestData,
      activeIndex: ":)"
    }

    const response = await api.put('/draws')
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

  it('PUT /draws: should not be able to update a draw if timestamp is NaN', async () => {
    const invalidDrawsRequestData = {
      ...updateDrawsRequestData,
      timestamp: ":)"
    }

    const response = await api.put('/draws')
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
