import { IDrawsRepository } from "@modules/draws/repositories/IDrawsRepository.ts";
import { IDeleteResult, IDrawDocument, ITabsDTO, IUpdateResult } from "@modules/draws/DTOs/DrawsDTO.ts";
import { ApplicationError } from "@shared/errors/ApplicationError.ts";

class DrawsRepositoryInMemory implements IDrawsRepository {
  private draws: Map<string, IDrawDocument> = new Map();
  private idCounter: number = 1;

  async findById(drawsId: string): Promise<IDrawDocument | null> {
    return await new Promise((resolve,_) => {
      setTimeout(() => {
        resolve(this.draws.get(drawsId) || null);
      }, 100);
    });
  }

  async create(tabsDTO: ITabsDTO): Promise<string | null> {
    return await new Promise((resolve, reject) => {
      try {
        const id = this.generateId();
        const document: IDrawDocument = {
          id,
          data: tabsDTO
        };
        
        this.draws.set(id, document);
        setTimeout(() => {
          resolve(id);
        }, 100);
      }
      catch (error) {
        reject(new ApplicationError("Draws Repository: Error creating document", 500, error as Error));
      }
    });
  }

  async update(drawDocument: IDrawDocument): Promise<IUpdateResult> {
    const { id } = drawDocument;
    return await new Promise((resolve, reject) => {
      if (!this.draws.has(id)) {
        setTimeout(() => {
          resolve({
            success: false,
            modifiedCount: 0,
            matchedCount: 0
          });
        }, 100);
      }
      
      try {
        this.draws.set(id, drawDocument);
        setTimeout(() => {
          resolve({
            success: true,
            modifiedCount: 1,
            matchedCount: 1
          });
        }, 100);
      }
      catch (error) {
        reject(new ApplicationError("Draws Repository: Not able to update Document", 500, error as Error));
        // return {
        //   success: false,
        //   modifiedCount: 0,
        //   matchedCount: 1
        // };
      }
    });
  }

  async delete(drawsId: string): Promise<IDeleteResult> {
    const existed = this.draws.has(drawsId);
    return await new Promise((resolve, reject) => {
      try {
        this.draws.delete(drawsId);
        setTimeout(() => {  
          resolve({
            success: true,
            deletedCount: existed ? 1 : 0
          });
        }, 100);
      } catch (error) {
        reject(new ApplicationError("Draws Repository: Not able to delete Document", 500, error as Error));
        // return {
        //   success: false,
        //   deletedCount: 0
        // };
      }
    });
  }

  private generateId(): string {
    const id = (this.idCounter++).toString().padStart(24, "0");
    return id;
  }

  getAllDraws(): IDrawDocument[] {
    return Array.from(this.draws.values());
  }

  clear(): void {
    this.draws = new Map();
    this.idCounter = 1;
  }
}

export const drawsRepository = new DrawsRepositoryInMemory();
