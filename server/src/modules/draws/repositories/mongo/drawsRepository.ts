import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { IDrawsDTO } from "@modules/draws/models/DTOs/DrawDTO.ts";


class DrawsRepository implements IDrawsRepository {
  async createDraws(drawsDTO: IDrawsDTO){
    // CALL MONGO AND SAVE
  } 
  async findDraw(draws_id: ){
    // FETCH BY ID IN MONGO TO RETURN TO CLIENT 
  }
}


export const drawsRepository = new DrawsRepository();