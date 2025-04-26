import { Server } from "node:http";
import { app } from "@shared/infra/http/app.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { expect } from "jsr:@std/expect/expect";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { createApi } from "@utils/sosotest.ts";

let userRequestData: ICreateUserDTO;
let server: Server;
const PORT = 3456;
const api = createApi('127.0.0.1', PORT);

describe('Authenticate User Controller', () => {
  beforeAll(async () => {
    server = app.listen(PORT);

    userRequestData = {
      email: "anything@test.com",
      username: "anyone",
      firstName: "Joe",
      lastName: "Doe",
      password: "TestPsswd!123_"
    };
    
    await usersRepository.create(userRequestData) as User;
  });

  afterAll(() => {
    usersRepository.clear();
    if (server) {
      server.close();
    }
  });


  it('POST /login: should be able to authenticate an user', async () => {
    const response = await api.post("/login").send({
        email: userRequestData.email,
        password: userRequestData.password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toEqual(
      expect.objectContaining({
        user: {
          email: userRequestData.email,
          username: userRequestData.username,
          firstName: userRequestData.firstName,
          lastName: userRequestData.lastName,
        }
      }),
    );
  });


  it('POST /login: should not be able to authenticate an user with an empty request body', async () => {
    const response = await api.post("/login").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Request body is missing information to authenticate this user!",
        }
      }),
    );
  });

  // VALIDATION
  it('POST /login: should not be able to authenticate an user with invalid email', async () => {
    const response = await api.post("/login").send({
      email: "invalid-email",
      password: userRequestData.password
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{ message: "Invalid email", path: "email"}]
        }
      }),
    );
  });

  it('POST /login: should not be able to authenticate an user with invalid password', async () => {
    const response = await api.post("/login").send({
      email: userRequestData.email,
      password: 'invalidpsswd'
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [
            {
              message: "The password must have at least one"
                + " uppercased character, one lowercased one"
                + ", a number and a special character.",
              path: "password"
            }
          ]
        }
      }),
    );
  });

  it('POST /login: should not be able to authenticate an user with a non-existent email', async () => {
    const response = await api.post("/login").send({
      email: "wrong@email.com",
      password: userRequestData.password
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Unauthorized",
          message: "Incorrect email or password!",
        }
      }),
    );
  });


  it('POST /login: should not be able to authenticate an user with the wrong password', async () => {
    const response = await api.post("/login").send({
      email: userRequestData.email,
      password: "WrongPassword1_!"
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Unauthorized",
          message: "Incorrect email or password!",
        }
      }),
    );
  });

});
