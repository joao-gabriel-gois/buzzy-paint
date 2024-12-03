import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { drawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";


class GetDrawsService {
  private drawsRepository: IDrawsRepository;
  private usersRepository: IUsersRepository;

  constructor(drawsRepository: IDrawsRepository, usersRepository: IUsersRepository) {
    this.drawsRepository = drawsRepository;
    this.usersRepository = usersRepository;
  }

  async execute(user_id: UUID) {
    const user = await this.usersRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError("(GetDrawService): There is no User with this ID.");
    }
    if (!user.draws_mongo_id) {
      throw new BusinessLogicError('(GetDrawService): This user already has an assigned Draw.');
    }
    const document = await this.drawsRepository.findById(user.draws_mongo_id);
    if (!document) {
      throw new NotFoundError('(GetDrawService)[MongoDB]: Failed to get a Mongo DB Document for user\'s draws');
    }
    return document.draws;
  }
}

export const getDrawsService = new GetDrawsService(drawsRepository, usersRepository);
