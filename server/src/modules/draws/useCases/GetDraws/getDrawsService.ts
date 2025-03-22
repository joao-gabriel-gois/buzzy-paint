import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { NotFoundError } from "@shared/errors/ApplicationError.ts";
import { drawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";
import { ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";

// class is exportable only for unit tests.
// Do not import it anywhere else to keep all
// services as singletons.
export class GetDrawsService {
  private drawsRepository: IDrawsRepository;
  private usersRepository: IUsersRepository;

  constructor(drawsRepository: IDrawsRepository, usersRepository: IUsersRepository) {
    this.drawsRepository = drawsRepository;
    this.usersRepository = usersRepository;
  }

  async execute(user_id: UUID): Promise<ITabsDTO | null> {
    const user = await this.usersRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError("(GetDrawService): There is no User with this ID.");
    }
    if (!user.draws_mongo_id) {
      // now draw assigned yet, clean state on client side once data is null
      return null;
    }
    const document = await this.drawsRepository.findById(user.draws_mongo_id);
    if (!document) {
      throw new NotFoundError("(GetDrawService): Failed to get a Mongo DB Document for user's draws");
    }
    return document.data;
  }
}

export const getDrawsService = new GetDrawsService(drawsRepository, usersRepository);
