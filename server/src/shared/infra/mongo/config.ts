import { MongoClient, Db, Collection, ObjectId } from "npm:mongodb@6.11.0";
import { ApplicationError, InvalidParameterError } from "@shared/errors/ApplicationError.ts";

const user = Deno.env.get("MONGO_ROOT_USER");
const password = Deno.env.get("MONGO_ROOT_PASSWORD");
// const db_name = Deno.env.get("MONGO_DATABASE");
const url = `mongodb://${user}:${password}@mongo:27017/admin`

export interface IMongoConnection {
  getClient: () => Promise<MongoClient | null>;
  getDb: () => Promise<Db | null>;
  getCollection: (collection_name: string) => Promise<Collection | null>;
  disconnectClient: () => Promise<boolean | null>;
}

const MongoConnection = (url: string): IMongoConnection => {
  if (!(user && password && url)) {
    throw new InvalidParameterError('Not able to acces .env variables. Contact Admin Immediately!');
  }
  let client: MongoClient | null = null; 
  let db: Db | null = null;

  const getClient = async () => {
    if (!client) client = new MongoClient(url);
    try {
      await client.connect();
      db = client.db('admin');
      return client;
    } catch(error) {
      throw new ApplicationError("MongoDB (getClient): Not able to get client", 500, error as Error);
    }
  }

  const getDb = async () => {
    try {
      if (!db) await getClient();
      return !db || !client ? null : client.db('admin');
    } catch(error) {
      throw new ApplicationError("MongoDB (getDb): Not able to get DB", 500, error as Error);
    }
  }

  const getCollection = async (collection_name: string) => {
    try {
      if (!db) await getClient();
    } catch(error) {
      throw new ApplicationError("MongoDB (getcollection): Not able to get Client:", 500, error as Error);
    }

    return db!.collection(collection_name);
  }

  const disconnectClient = async () => {
    if (!client) return client;
    try {
      await client.close();
      client = null;
      db = null;
      return true;
    } catch(error) {
      throw new ApplicationError("MongoDB (disconnectClient): Not able to disconnect client", 500, error as Error);
    }
  }


  return {
    getDb,
    getCollection,
    getClient,
    disconnectClient
  }
}

const mongoConnection = MongoConnection(url);

export {
  mongoConnection,
  Collection,
  MongoClient,
  Db,
  ObjectId,
}
