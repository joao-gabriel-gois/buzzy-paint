import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { drawsRepository as prodDrawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { drawsRepository as testDrawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { usersRepository as prodUsersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { usersRepository as testUsersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";


const ENV = Deno.env.get('ENV');
const drawsRepository = ENV === 'test' ? testDrawsRepository : prodDrawsRepository;
const usersRepository = ENV === 'test' ? testUsersRepository : prodUsersRepository;


export async function createDrawsService(user_id: UUID, tabsDTO: ITabsDTO) {
  const user = await usersRepository.findById(user_id);
  if (!user) {
    throw new NotFoundError("(CreateDrawService): There is no User with this ID.");
  }

  if (user.draws_mongo_id) {
    throw new BusinessLogicError("(CreateDrawService): This user already has an assigned Draw.");
  }
  // need to handle errors here
  const draws_mongo_id = await drawsRepository.create(tabsDTO);

  if (!draws_mongo_id) {
    throw new NotFoundError("(CreateDrawService): Failed to create a Mongo DB Document for user's draws", 500);
  }

  try {
    await usersRepository.update({
      id: user_id,
      draws_mongo_id
    });
  }
  catch(error) {
    const deleted = await drawsRepository.delete(draws_mongo_id);
    console.log("Create Draw Service failing to update Postgres, deleting from mongo then:", deleted);
    console.error(error);
    throw error;
  }
}

