import { Server } from "node:http";
import { app } from "@shared/infra/http/app.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { expect } from "jsr:@std/expect/expect";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { createApi } from "@utils/sosotest.ts";
import { sleep } from "@utils/sleep.ts";

let userRequestData: ICreateUserDTO & { confirmPassword: string };
let server: Server;
const PORT = 3456;
const api = createApi("127.0.0.1", PORT);

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    server = app.listen(PORT);

    userRequestData = {
      email: "anything@test.com",
      username: "anyone",
      firstName: "Joe",
      lastName: "Doe",
      password: "TestPsswd!123_",
      confirmPassword: "TestPsswd!123_",
    };
    // need to be sure that the server is up. In the auth case we at least
    // create an user with the fake-async user repo while here, without an
    // async/await call, the test was previosly returning connection refused
    // by simply waiting the sleep to be executed in the eventQueue with 0ms
    // is enough time to make the test work, instead of immediately execute it
    await sleep(0);
  });

  afterAll(() => {
    usersRepository.clear();
    if (server) {
      server.close();
    }
  });


  it("POST /users: should be able to create an user", async () => {
    const response = await api.post("/users").send(userRequestData);

    expect(response.status).toBe(201);
  });


  it("POST /users: should not be able to create an user with repeated email", async () => {
    const requestData = {
      ...userRequestData,
      username: "anyother"
    };
    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Business Logic Error",
          message: "User with this email already exists",
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user with repeated username", async () => {
    const requestData = {
      ...userRequestData,
      email: "another@email.com"
    };
    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Business Logic Error",
          message: "User with this username already exists",
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user with an empty request body", async () => {
    const response = await api.post("/users").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Bad Request",
          message: "Request body is missing information to create new user!",
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the password wasn't confirmed", async () => {
    const requestData = {
      ...userRequestData,
      confirmPassword: "DifferentPsswd!123_"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "Error confirming password",
          issues: [{ 
            message: "Please confirm the password correctly. "
              + "The input for password and confirm-password are not the same.",
            path: "confirmPassword"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the username has less than 4 characters", async () => {
    const requestData = {
      ...userRequestData,
      username: "Abc"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{
            message: "Username must have at least 4 characters",
            path: "username"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the username has more than 12 characters", async () => {
    const requestData = {
      ...userRequestData,
      username: "TooLongUsername"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{ 
            message: "Username can't have more than 12 characters",
            path: "username"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the username doesn't follow the expected rules", async () => {
    const requestData = {
      ...userRequestData,
      username: "!nval1dUs3r*"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{ 
            message: "Username must only accepts letter, numbers and"
              + " the following special characters: ., _, %, + or -",
            path: "username"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the First Name doesn't follow the expected rules", async () => {
    const requestData = {
      ...userRequestData,
      firstName: "1nvalid_name*"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{ 
            message: "First Name only accepts Letters and spaces",
            path: "firstName"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the Last Name doesn't follow the expected rules", async () => {
    const requestData = {
      ...userRequestData,
      lastName: "1nvalid_name*"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [{ 
            message: "Last Name only accepts Letters and spaces",
            path: "lastName"
          }]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the password has less than 10 characters", async () => {
    const requestData = {
      ...userRequestData,
      password: "TooSh0rt_",
      confirmPassword: "TooSh0rt_",
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [
            { 
              message: "The password must have at least 10 characters.",
              path: "password"
            },
            { 
              message: "The password must have at least 10 characters.",
              path: "confirmPassword"
            },
          ]
        }
      }),
    );
  });


  it("POST /users: should not be able to create an user if the password doesn't follow the expected rules", async () => {
    const requestData = {
      ...userRequestData,
      password: "invalidpasswordrule",
      confirmPassword: "invalidpasswordrule"
    };

    const response = await api.post("/users").send(requestData);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: "Validation Error",
          message: "There is one or more input validation errors",
          issues: [
            { 
              message: "The password must have at least one uppercased character"
                + ", one lowercased one, a number and a special character.",
              path: "password"
            },
            { 
              message: "The password must have at least one uppercased character"
                + ", one lowercased one, a number and a special character.",
              path: "confirmPassword"
            },
          ]
        }
      }),
    );
  });

});