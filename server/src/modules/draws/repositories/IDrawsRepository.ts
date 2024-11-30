
import { IDrawsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { MongoId } from "@modules/draws/types.d.ts";

// NoSQL object, no schema, everything is a DTO and there is no processing
// at least for now, for this info as a Model. The application is a proxy to mongo, basically.
type Draws = IDrawsDTO;

export interface IDrawsRepository {
  createDraw: (drawsDTO: IDrawsDTO) => Promise<UUID>;
  findDraw: (draws_id: MongoId) => Promise<Draws>;
}