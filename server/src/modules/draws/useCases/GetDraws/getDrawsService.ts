import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { drawsRepository as prodDrawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { drawsRepository as testDrawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { usersRepository as prodUsersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { usersRepository as testUsersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { NotFoundError } from "@shared/errors/ApplicationError.ts";

const ENV = Deno.env.get('ENV');
const drawsRepository = ENV === 'test' ? testDrawsRepository : prodDrawsRepository;
const usersRepository = ENV === 'test' ? testUsersRepository : prodUsersRepository;


export async function getDrawsService(user_id: UUID): Promise<ITabsDTO | null> {
  const user = await usersRepository.findById(user_id);
  if (!user) {
    throw new NotFoundError("(GetDrawService): There is no User with this ID.");
  }
  if (!user.draws_mongo_id) {
    // now draw assigned yet, clean state on client side once data is null
    return null;
  }
  
  const document = await drawsRepository.findById(user.draws_mongo_id);
  if (!document) {
    throw new NotFoundError("(GetDrawService): Failed to get a Mongo DB Document for user's draws");
  }

  return document.data;
}
