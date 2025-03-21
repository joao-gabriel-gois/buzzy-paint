import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { drawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";

// class is exportable only for unit tests.
// Do not import it anywhere else to keep all
// services as singletons.
export class UpdateDrawsService {
  private drawsRepository: IDrawsRepository;
  private usersRepository: IUsersRepository;

  constructor(drawsRepository: IDrawsRepository, usersRepository: IUsersRepository) {
    this.drawsRepository = drawsRepository;
    this.usersRepository = usersRepository;
  }

  async execute(user_id: UUID, tabsDTOs: ITabsDTO) {
    const user = await this.usersRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError("(UpdateDrawService): There is no User with this ID.");
    }
    const draws_mongo_id = user.draws_mongo_id;
    if (!draws_mongo_id) {
      throw new BusinessLogicError("(UpdateDrawService): This user doesn't have an assigned Draw.");
    }
    
    await this.drawsRepository.update({
      id: draws_mongo_id,
      data: tabsDTOs
    });
  }
  
}

export const updateDrawsService = new UpdateDrawsService(drawsRepository, usersRepository);
