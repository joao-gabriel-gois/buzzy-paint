import { IDeleteResult, IDrawDocument, ITabsDTO, IUpdateResult } from "@modules/draws/DTOs/DrawsDTO.ts";
import { mongoConnection, Collection, ObjectId, IMongoConnection } from "@shared/infra/mongo/config.ts"; 
import { ApplicationError } from "@shared/errors/ApplicationError.ts";
import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";

export class DrawsRepository implements IDrawsRepository {
  private collection: Collection | null = null;
  private mongoConnection: IMongoConnection;

  constructor(mongoConnection: IMongoConnection) {
    this.mongoConnection = mongoConnection;
  }

  async findById(drawsId: string): Promise<IDrawDocument | null> {
    await this.#updateCollection();
    try {
      const mongoId = new ObjectId(drawsId);
      const document = await this.collection!.findOne({ _id: mongoId });
      
      if (!document) return null;
      
      return {
        id: document._id.toString(),
        data: document.data as ITabsDTO
      };
    } catch(error) {
      throw new ApplicationError(
        "DrawsRepository: Not able to execute findOne",
        500,
        error as Error
      );
    }
  }
  
  async create(tabsDTO: ITabsDTO): Promise<string | null> {
    await this.#updateCollection();
    try {
      const created = await this.collection!.insertOne({ data: tabsDTO });
      if (created.acknowledged) {
        return created.insertedId.toString() || null;
      }
    } catch(error) {
      throw new ApplicationError(
        "DrawsRepository: Not able to insert Document",
        500,
        error as Error
      );
    }
    return null;
  }

  async update(drawDocument: IDrawDocument): Promise<IUpdateResult> {
    await this.#updateCollection();
    const { id, data } = drawDocument;
    
    try {
      const updated = await this.collection!.updateOne(
        { _id: new ObjectId(id) },
        { $set: { data } }
      );
      
      return {
        success: updated.acknowledged,
        modifiedCount: updated.modifiedCount,
        matchedCount: updated.matchedCount
      };
    } catch(error) {
      throw new ApplicationError(
        "DrawsRepository: Not able to update Document",
        500,
        error as Error
      );
    }
  }

  async delete(drawsId: string): Promise<IDeleteResult> {
    await this.#updateCollection();
    try {
      const result = await this.collection!.deleteOne({
        _id: new ObjectId(drawsId)
      });
      
      return {
        success: result.acknowledged,
        deletedCount: result.deletedCount
      };
    } catch(error) {
      throw new ApplicationError(
        "DrawsRepository: Not able to delete Document",
        500,
        error as Error
      );
    }
  }

  async #updateCollection() {
    try {
      if (!this.collection) {
        this.collection = await this.mongoConnection.getCollection("draws");
      }
      return this.collection;
    } catch(error) {
      throw new ApplicationError(
        "DrawsRepository: Not able to get collection",
        500,
        error as Error
      );
    }
  }
}

export const drawsRepository = new DrawsRepository(mongoConnection);

// PREVIOUS IMPL BACKUP BEFORE TESTS
// import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
// import { ITabsDTO, IDrawsMongoDocumentDTO } from "@modules/draws/DTOs/DrawsDTO.ts";
// import { mongoConnection, Collection, ObjectId, IMongoConnection,  } from "@shared/infra/mongo/config.ts"; 
// import { ApplicationError } from "@shared/errors/ApplicationError.ts";

// class DrawsRepository implements IDrawsRepository {
//   private collection: Collection | null = null;
//   private mongoConnection: IMongoConnection;

//   constructor(mongoConnection: IMongoConnection) {
//     this.mongoConnection = mongoConnection;
//   }

//   async findById(draws_id: string) {
//     await this.#updateCollection();
//     try {
//       const mongoId = new ObjectId(draws_id);
//       return await this.collection!.findOne({ _id: mongoId });
//     }
//     catch(error) {
//       throw new ApplicationError(
//         "Mongo DB: Not able to execute findOne",
//         500,
//         error as Error
//       );
//     }
//   }
  
//   async create(tabsDTO: ITabsDTO) {
//     await this.#updateCollection();
//     try {
//       const created = await this.collection!.insertOne({ data: tabsDTO });
//       if (created.acknowledged) {
//         return created.insertedId.toString() || null;
//       }
//     }
//     catch(error) {
//       throw new ApplicationError(
//         "Mongo DB: Not able to insert Document",
//         500,
//         error as Error
//       );
//     }
//     return null;
//   }

//   async update(drawsMongoDocDTO: IDrawsMongoDocumentDTO) {
//     await this.#updateCollection();
//     const { id, data } = drawsMongoDocDTO;
//     try {
//       const updated = await this.collection!.updateOne({
//           _id: new ObjectId(id)
//         }, {
//         $set: {
//           data,
//         }
//       });
//       return updated;
//     }
//     catch(error) {
//       throw new ApplicationError(
//         "Mongo DB: Not able to update Document",
//         500,
//         error as Error
//       );
//     }
//   }

//   async delete(draws_id: string) {
//     await this.#updateCollection();
//     try {
//       return await this.collection!.deleteOne({
//         _id: new ObjectId(draws_id)
//       });
//     }
//     catch(error) {
//       throw new ApplicationError(
//         "Mongo DB: Not able to delete Document",
//         500,
//         error as Error
//       );
//     }
//   }


//   async #updateCollection() {
//     try {
//       if (!this.collection) {
//         this.collection = await this.mongoConnection.getCollection("draws");
//       }
//       return this.collection;
//     }
//     catch(error) {
//       throw new ApplicationError(
//         "Mongo DB: Not able to get collection",
//         500,
//         error as Error
//       );
//     }

//   }

// }


// export const drawsRepository = new DrawsRepository(mongoConnection);