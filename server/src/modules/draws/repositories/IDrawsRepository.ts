
import { IDrawsDTO, IDrawsMongoDocumentDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
import { WithId, Document, UpdateResult, DeleteResult } from "npm:mongodb@6.11.0";

export interface IDrawsRepository {
  findById: (draws_id: string) => Promise<WithId<Document> | null>;
  create: (drawsDTO: IDrawsDTO[]) => Promise<string | null>;
  update: (drawMongoDocDTO: IDrawsMongoDocumentDTO) => Promise<UpdateResult<Document> | null>;
  delete: (draws_id: string) => Promise<DeleteResult>;
}