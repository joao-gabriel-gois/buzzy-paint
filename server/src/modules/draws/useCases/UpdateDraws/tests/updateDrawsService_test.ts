import { v4 as uuid } from "npm:uuid";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect/expect";
import { unreachable } from "@std/assert/unreachable";
import { User } from "@modules/accounts/models/User.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { drawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { createDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { updateDrawsService } from "@modules/draws/useCases/UpdateDraws/updateDrawsService.ts";
import { getDrawsService } from "@modules/draws/useCases/GetDraws/getDrawsService.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { tabsDTOTestSample, tabsDTOTestSampleUpdate } from "@modules/draws/useCases/tabsDTOTestSample.ts";

let user: User;
let userRequestData: ICreateUserDTO;
let createdDraws: ITabsDTO | null;

describe("Update Draws Service", () => {
  beforeAll(async () => {
    userRequestData = {
      email: "anything@test.com",
      username: "anyone",
      firstName: "Joe",
      lastName: "Doe",
      password: "TestPsswd!123_"
    };
    user = await usersRepository.create(userRequestData) as User;
    
    await createDrawsService(user.id, tabsDTOTestSample);
   
    createdDraws = await getDrawsService(user.id);
    if (!createdDraws) {
      throw new Error(
        'Test has failed. It was not possible to create the first draw for next tests.'
      );
    }
  });

  afterAll(() => {
    usersRepository.clear();
    drawsRepository.clear();
  });

  it("should be able to update draws", async () => {
    await updateDrawsService(
      user.id,
      tabsDTOTestSampleUpdate
    );

    const updatedDraws = await getDrawsService(user.id);

    expect(updatedDraws).not.toBe(null);
    expect(updatedDraws).not.toBe(createdDraws);
  });

  it("should not be able to update draws for a non-existent user", async () => {
    try {
      await updateDrawsService(uuid() as UUID, tabsDTOTestSample);
      unreachable("Expected NotFoundError was not thrown for not found user_id");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("(UpdateDrawService): There is no User with this ID.");
    }
  });

  it("should throw NotFoundError when user's draws_mongo_id doesn't match any document", async () => {
    const newUserWithInvalidDrawsId = await usersRepository.create({
      ...userRequestData,
      email: "invalid-draws@test.com",
      username: "invalid-draws-user"
    }) as IUpdateUserDTO;
    
    // creating non null but invalid id for the new user
    newUserWithInvalidDrawsId.draws_mongo_id = undefined;
    await usersRepository.update(newUserWithInvalidDrawsId);
    
    try {
      await updateDrawsService(newUserWithInvalidDrawsId.id, tabsDTOTestSample);
      unreachable("Expected BusinessLogicError was not thrown for an existent draws document");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("(UpdateDrawService): This user doesn't have an assigned Draw.");
    }
  });
});
