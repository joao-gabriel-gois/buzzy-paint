import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { IDrawsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { BusinessLogicError, NotFoundError } from "@shared/errors/ApplicationError.ts";
import { drawsRepository } from "@modules/draws/repositories/mongo/drawsRepository.ts";
import { usersRepository } from "@modules/accounts/repositories/postgres/usersRepository.ts";


class UpdateDrawsService {
  private drawsRepository: IDrawsRepository;
  private usersRepository: IUsersRepository;

  constructor(drawsRepository: IDrawsRepository, usersRepository: IUsersRepository) {
    this.drawsRepository = drawsRepository;
    this.usersRepository = usersRepository;
  }

  async execute(user_id: UUID, drawsDTOs: IDrawsDTO[]) {
    const user = await this.usersRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError("(UpdateDrawService): There is no User with this ID.");
    }
    const mongoId = user.draws_mongo_id;
    if (!mongoId) {
      throw new BusinessLogicError('(UpdateDrawService): This user already has an assigned Draw.');
    }
    
    await this.drawsRepository.update({
      id: mongoId,
      draws: drawsDTOs
    });
  }
  
}

export const updateDrawsService = new UpdateDrawsService(drawsRepository, usersRepository);
