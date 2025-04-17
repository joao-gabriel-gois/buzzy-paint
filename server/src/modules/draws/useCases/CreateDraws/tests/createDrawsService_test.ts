import { v4 as uuid } from "npm:uuid";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { unreachable } from "@std/assert/unreachable";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { ICreateUserDTO } from "@modules/accounts/DTOs/CreateUserDTO.ts";
import { IUpdateUserDTO } from "@modules/accounts/DTOs/UpdateUserDTO.ts";
import { User } from "@modules/accounts/models/User.ts";
import { drawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { createDrawsService } from "@modules/draws/useCases/CreateDraws/createDrawsService.ts";
import { tabsDTOTestSample } from "@modules/draws/useCases/tabsDTOTestSample.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";

let userRequestData: ICreateUserDTO;
let user: User;

describe("Create Draws Service", () => {
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

  
  it("should be able to create a draw", async () => {
    await createDrawsService(user.id, tabsDTOTestSample);
    expect(user.draws_mongo_id).not.toEqual(null);

    if (user.draws_mongo_id) {
      const draws = await drawsRepository.findById(user.draws_mongo_id);
      expect(draws).not.toEqual(null);
    }
  });

  it("should not be able to create a draw for a non-existent user", async () => {
    try {
      await createDrawsService(uuid() as UUID, tabsDTOTestSample);
      unreachable("Expected NotFoundError was not thrown for not found user_id");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("(CreateDrawService): There is no User with this ID.");
    }
  });

  it("should not be able to create a draw for an user that already created one", async () => {
    try {
      await createDrawsService(user.id, tabsDTOTestSample);
      unreachable("Expected BusinessLogicError was not thrown for already assigned Draw");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("(CreateDrawService): This user already has an assigned Draw.");
    }
  });

  it("should throw NotFoundError when MongoDB document creation fails", async () => {
    const newUser = await usersRepository.create({
      ...userRequestData,
      email: "mongo-failure@test.com",
      username: "mongo-failure-user"
    }) as User;
    
    drawsRepository.clear!();
    const originalDrawsCreate = drawsRepository.create.bind(drawsRepository);
    drawsRepository.create = async () => 
      await new Promise((resolve, _) => resolve(null));

    try {
      await createDrawsService(newUser.id, tabsDTOTestSample);
      unreachable("Expected NotFoundError was not thrown when MongoDB document creation fails");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("(CreateDrawService): Failed to create a Mongo DB Document for user's draws");
      
      const updatedUser = await usersRepository.findById(newUser.id);
      expect(updatedUser?.draws_mongo_id).toBeNull();
    }
    finally {
      drawsRepository.create = originalDrawsCreate;
    }
  });

  it("should delete MongoDB document if PostgreSQL update fails", async () => {
    // cleaning all repositories for this test
    usersRepository.clear!();
    drawsRepository.clear!();
    
    const cleanUser = await usersRepository.create({
      ...userRequestData,
      email: "rollback-test@test.com",
      username: "rollback-user"
    }) as User;

    let deleteWasCalled = false;
    let createdMongoId: string | null = null;
    // let deletedId: string | null = null;
    
    // overwritting methods to force error usecase
    const originalDrawsCreate = drawsRepository.create.bind(drawsRepository);
    drawsRepository.create = async (data: ITabsDTO) => {
      createdMongoId = await originalDrawsCreate(data);
      return createdMongoId;
    };
    
    const originalUsersUpdate = usersRepository.update.bind(drawsRepository);
    usersRepository.update = async (userDTO: IUpdateUserDTO): Promise<ManageableUser> => {
      const user = await usersRepository.findById(userDTO.id);
      if (!user) {
        throw new NotFoundError("User not found");
      } 
      return new Promise((_, reject) => {
        reject(new NotFoundError("Simulated PostgreSQL update failure"));
      });
    };
    
    const originalDrawsDelete = drawsRepository.delete.bind(drawsRepository);
    drawsRepository.delete = async (id: UUID) => {
      deleteWasCalled = true;
      // deletedId = id;
      return await originalDrawsDelete(id);
    };
    
    // actually testing
    try {
      await createDrawsService(cleanUser.id, tabsDTOTestSample);
      unreachable("Expected error was not thrown when PostgreSQL update fails");
    }
    catch(error) {
      if (!(error instanceof Error)) {
        unreachable("Caught value is not an instance of Error");
        return;
      }
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Simulated PostgreSQL update failure");
      expect(deleteWasCalled).toBe(true);
      
      if (createdMongoId) {
        const doc = await drawsRepository.findById(createdMongoId);
        expect(doc).toBe(null);
      }
      const updatedUser = await usersRepository.findById(cleanUser.id);
      expect(updatedUser?.draws_mongo_id).toBeNull();
    }
    finally {
      // backing original methods up for possible next tests
      drawsRepository.create = originalDrawsCreate;
      drawsRepository.delete = originalDrawsDelete;
      usersRepository.update = originalUsersUpdate;
    }
  });
});
