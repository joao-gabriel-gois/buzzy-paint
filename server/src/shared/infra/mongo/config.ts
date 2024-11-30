import { MongoClient } from "npm:mongodb@6.11.0";

const user = Deno.env.get("MONGO_ROOT_USER");
const password = Deno.env.get("MONGO_ROOT_PASSWORD");
const url = `mongodb://${user}:${password}@mongo:27017/draws`;

const MongoConnection = (url: string) => {
  let client: MongoClient | null = null; 

  const getClient = async () => {
    if (!client) client = new MongoClient(url);
    await client.connect();
    return client;
  }

  const disconnectClient = async () => {
    if (! client) return;
    await client.close();
    client = null;
  }

  return {
    getClient,
    disconnectClient
  }
}

export const mongoConnection = MongoConnection(url);
