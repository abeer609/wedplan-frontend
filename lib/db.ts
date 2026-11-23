import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  __wedplanMongoClient: MongoClient | undefined;
  __wedplanMongoDb: Db | undefined;
};

function connect(): Db {
  if (globalForMongo.__wedplanMongoDb) return globalForMongo.__wedplanMongoDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  globalForMongo.__wedplanMongoClient ??= new MongoClient(uri);
  globalForMongo.__wedplanMongoDb = globalForMongo.__wedplanMongoClient.db();
  return globalForMongo.__wedplanMongoDb;
}

export function getDb(): Db {
  if (process.env.MONGODB_URI) return connect();
  return new Proxy({} as Db, {
    get(_target, prop) {
      const live = connect();
      const value = live[prop as keyof Db];
      return typeof value === "function" ? value.bind(live) : value;
    },
  });
}

export function getMongoClient(): MongoClient {
  connect();
  return globalForMongo.__wedplanMongoClient!;
}
