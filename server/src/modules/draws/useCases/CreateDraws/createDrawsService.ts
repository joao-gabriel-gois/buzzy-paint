import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { drawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";


class CreateDrawsService {
  private drawsRepository: IDrawsRepository;
  private usersRepository: IUsersRepository;

  constructor(drawsRepository: IDrawsRepository, usersRepository: IUsersRepository) {
    this.drawsRepository = drawsRepository;
    this.usersRepository = usersRepository;
  }

  async execute(user_id: UUID, tabsDTO: ITabsDTO) {
    const user = await this.usersRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError("(CreateDrawService): There is no User with this ID.");
    }
    if (user.draws_mongo_id) {
      throw new BusinessLogicError('(CreateDrawService): This user already has an assigned Draw.');
    }
    const draws_mongo_id = await this.drawsRepository.create(tabsDTO);
    if (!draws_mongo_id) {
      throw new NotFoundError('(CreateDrawService)[MongoDB]: Failed to create a Mongo DB Document for user\'s draws', 500);
    }

    try {
      await this.usersRepository.update({
        id: user_id,
        draws_mongo_id
      });
    }
    catch(error) {
      // need to implement - if not able to update reference to user in pg, simply delete the document from mongo
      const deleted = await this.drawsRepository.delete(draws_mongo_id);
      console.log('Create Draw Service failing to update Postgres, deleting from mongo then:', deleted);
      console.error(error);
      throw error;
    }
  }
}

export const createDrawsService = new CreateDrawsService(drawsRepository, usersRepository);
