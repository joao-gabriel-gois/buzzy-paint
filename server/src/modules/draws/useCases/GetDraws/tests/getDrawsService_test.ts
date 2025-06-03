import { v4 as uuid } from "npm:uuid";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect/expect";
import { unreachable } from "@std/assert/unreachable";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { drawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { createDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { getDrawsService } from "@modules/draws/useCases/GetDraws/getDrawsService.ts";
import { NotFoundError } from "@shared/errors/ApplicationError.ts";
import { tabsDTOTestSample } from "@modules/draws/useCases/tabsDTOTestSample.ts";

let userRequestData: ICreateUserDTO;
let user: User;

describe("Get Draws Service", () => {
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
    drawsRepository.clear();
  });

  it("should be able to get draws", async () => {
    await createDrawsService(user.id, tabsDTOTestSample);
    const draws = await getDrawsService(user.id);
    expect(draws).not.toBe(null);
    expect(draws).toBe(tabsDTOTestSample);
  });

  it("should not be able to get draws for a non-existent user", async () => {
    try {
      await getDrawsService(uuid() as UUID);
      unreachable("Expected NotFoundError was not thrown for not found user_id");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("(GetDrawService): There is no User with this ID.");
    }
  });

  it("should throw NotFoundError when user's draws_mongo_id doesn't match any document", async () => {
    const newUserWithInvalidDrawsId = await usersRepository.create({
      ...userRequestData,
      email: "invalid-draws@test.com",
      username: "invalid-draws-user"
    }) as IUpdateUserDTO;
    
    // creating non null but invalid id for the new user
    newUserWithInvalidDrawsId.draws_mongo_id = uuid() as UUID;
    await usersRepository.update(newUserWithInvalidDrawsId);
    
    try {
      await getDrawsService(newUserWithInvalidDrawsId.id);
      unreachable("Expected NotFoundError was not thrown for non-existent draws document");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("(GetDrawService): Failed to get a Mongo DB Document for user's draws");
    }
  });
});
