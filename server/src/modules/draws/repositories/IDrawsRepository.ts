import { IDeleteResult, IDrawDocument, ITabsDTO, IUpdateResult } from "@modules/draws/DTOs/DrawsDTO.ts";

export interface IDrawsRepository {
  findById(drawsId: string): Promise<IDrawDocument | null>;
  create(tabsDTO: ITabsDTO): Promise<string | null>;
  update(drawDocument: IDrawDocument): Promise<IUpdateResult>;
  delete(drawsId: string): Promise<IDeleteResult>;
  clear?(): void; // Only for inMemory unit test based repos
}

// PREVIOUS IMPL BACKUP BEFORE TESTS
// import { IDrawsMongoDocumentDTO, ITabsDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
// import { WithId, Document, UpdateResult, DeleteResult } from "npm:mongodb@6.11.0";

// export interface IDrawsRepository {
//   findById: (draws_id: string) => Promise<WithId<Document> | null>;
//   create: (tabsDTO: ITabsDTO) => Promise<string | null>;
//   update: (drawsMongoDocDTO: IDrawsMongoDocumentDTO) => Promise<UpdateResult<Document> | null>;
//   delete: (draws_id: string) => Promise<DeleteResult>;
// }