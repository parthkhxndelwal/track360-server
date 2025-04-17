import { MongoClient } from "mongodb";

// Connection URL
const MONGODB_URI =
  "mongodb+srv://parthkhandelwal:parthcodesop@devcluster.5tuzejk.mongodb.net/?retryWrites=true&w=majority&appName=devCluster";

// Database Name
const DB_NAME = "track360";

// Cache the MongoDB connection to reuse it across requests
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable"
    );
  }

  if (!DB_NAME) {
    throw new Error(
      "Please define the DB_NAME environment variable"
    );
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export function getCollection(collectionName: string) {
  if (!cachedDb) {
    throw new Error("Database connection not established. Call connectToDatabase() first.");
  }
  return cachedDb.collection(collectionName);
} 