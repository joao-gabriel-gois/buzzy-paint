import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { drawsRepository as prodDrawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { drawsRepository as testDrawsRepository } from "@modules/draws/repositories/in-memory/drawsRepository.ts";
import { usersRepository as prodUsersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { usersRepository as testUsersRepository } from "@modules/accounts/repositories/in-memory/usersRepository.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";

const ENV = Deno.env.get('ENV');
const drawsRepository = ENV === 'test' ? testDrawsRepository : prodDrawsRepository;
const usersRepository = ENV === 'test' ? testUsersRepository : prodUsersRepository;

export async function updateDrawsService(user_id: UUID, tabsDTOs: ITabsDTO) {
  const user = await usersRepository.findById(user_id);
  if (!user) {
    throw new NotFoundError("(UpdateDrawService): There is no User with this ID.");
  }
  const draws_mongo_id = user.draws_mongo_id;
  if (!draws_mongo_id) {
    throw new BusinessLogicError("(UpdateDrawService): This user doesn't have an assigned Draw.");
  }
  
  await drawsRepository.update({
    id: draws_mongo_id,
    data: tabsDTOs
  });
}
