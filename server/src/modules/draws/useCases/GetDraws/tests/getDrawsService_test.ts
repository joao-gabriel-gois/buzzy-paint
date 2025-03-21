import { v4 as uuid } from "npm:uuid";
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect/expect";
import { unreachable } from "@std/assert/unreachable";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { DrawsRepositoryInMemory } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { UsersRepositoryInMemory } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { CreateDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { GetDrawsService } from "@modules/draws/useCases/GetDraws/getDrawsService.ts";
import { NotFoundError } from "@shared/errors/ApplicationError.ts";
import { tabsDTOTestSample } from "@modules/draws/useCases/tabsDTOTestSample.ts";

let userRequestData: ICreateUserDTO;
let user: User;
let usersRepository: IUsersRepository;
let drawsRepository: IDrawsRepository;
let createDrawsService: CreateDrawsService;
let getDrawsService: GetDrawsService;

describe("Get Draws Service", () => {
  beforeAll(async () => {
    usersRepository = new UsersRepositoryInMemory();
    drawsRepository = new DrawsRepositoryInMemory();
    userRequestData = {
      email: "anything@test.com",
      username: "anyone",
      firstName: "Joe",
      lastName: "Doe",
      password: "TestPsswd!123_"
    };
    user = await usersRepository.create(userRequestData) as User;
    createDrawsService = new CreateDrawsService(drawsRepository, usersRepository);
    getDrawsService = new GetDrawsService(drawsRepository, usersRepository);
  });

  it("should be able to get draws", async () => {
    await createDrawsService.execute(user.id, tabsDTOTestSample);
    const draws = await getDrawsService.execute(user.id);
    expect(draws).not.toBe(null);
    expect(draws).toBe(tabsDTOTestSample);
  });

  it("should not be able to get draws for a non-existent user", async () => {
    try {
      await getDrawsService.execute(uuid() as UUID);
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
      await getDrawsService.execute(newUserWithInvalidDrawsId.id);
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
