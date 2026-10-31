import { MongoClient, Db } from "mongodb";

export function getNormalizedUri(): string {
  let raw = (process.env.MONGODB_URI || "").trim();
  // Strip outer quotes if present (e.g. "mongodb+srv://..." or 'mongodb+srv://...')
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  if (raw.startsWith("mongodb+srv:/") && !raw.startsWith("mongodb+srv://")) {
    raw = raw.replace("mongodb+srv:/", "mongodb+srv://");
  } else if (raw.startsWith("mongodb:/") && !raw.startsWith("mongodb://")) {
    raw = raw.replace("mongodb:/", "mongodb://");
  }
  return raw;
}

const defaultDbName = process.env.MONGODB_DB || "vidyamotion";

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(getNormalizedUri());
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getNormalizedUri();
  if (!uri) {
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri);
      clientPromise = client.connect().catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  }
}

export async function getDatabase(customDbName?: string): Promise<Db | null> {
  const connectedClient = await getMongoClient();
  if (!connectedClient) {
    return null;
  }
  const targetDb = customDbName || defaultDbName;
  return connectedClient.db(targetDb);
}
