import { getDatabase, isMongoConfigured } from "../mongodb";
import { hashPassword, verifyPassword } from "../auth";
import { Db, ObjectId } from "mongodb";

export interface UserRecord {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// In-memory fallback cache only for local dev when MONGODB_URI is not provided
const memoryUsers = new Map<string, UserRecord>();

let usersIndexInitialized: Promise<unknown> | null = null;
async function ensureUserIndexes(db: Db): Promise<void> {
  if (!usersIndexInitialized) {
    usersIndexInitialized = db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true })
      .catch((err) => {
        usersIndexInitialized = null;
        console.error("Failed to create users collection indexes:", err);
      });
  }
  await usersIndexInitialized;
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<UserProfile> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(data.password);
  const now = new Date();
  const name = (typeof data.name === "string" && data.name.trim()) || normalizedEmail.split("@")[0];

  if (isMongoConfigured()) {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Unable to connect to the database. Please verify your connection.");
    }

    await ensureUserIndexes(db);

    const doc = {
      email: normalizedEmail,
      passwordHash,
      name,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await db.collection("users").insertOne(doc);
      return {
        id: result.insertedId.toString(),
        email: normalizedEmail,
        name,
        createdAt: now,
      };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new Error("An account with this email already exists.");
      }
      throw err;
    }
  }

  // Fallback in-memory store only when no MongoDB is configured
  const id = new ObjectId().toString();
  const record: UserRecord = {
    _id: id,
    email: normalizedEmail,
    passwordHash,
    name,
    createdAt: now,
    updatedAt: now,
  };
  memoryUsers.set(normalizedEmail, record);

  return {
    id,
    email: normalizedEmail,
    name,
    createdAt: now,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMongoConfigured()) {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable.");
    }
    const doc = await db.collection("users").findOne({ email: normalizedEmail });
    if (doc) {
      return {
        _id: doc._id.toString(),
        email: doc.email,
        passwordHash: doc.passwordHash,
        name: doc.name || doc.email.split("@")[0],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    }
    return null;
  }

  return memoryUsers.get(normalizedEmail) || null;
}

export async function findUserById(id: string): Promise<UserProfile | null> {
  if (isMongoConfigured()) {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable.");
    }
    let query: Record<string, unknown> = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const doc = await db.collection("users").findOne(query);
    if (doc) {
      return {
        id: doc._id.toString(),
        email: doc.email,
        name: doc.name || doc.email.split("@")[0],
        createdAt: doc.createdAt,
      };
    }
    return null;
  }

  for (const user of memoryUsers.values()) {
    if (user._id === id) {
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
    }
  }

  return null;
}

export async function authenticateUser(
  email: string,
  passwordPlain: string
): Promise<UserProfile | null> {
  if (typeof email !== "string" || typeof passwordPlain !== "string") {
    return null;
  }

  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(passwordPlain, user.passwordHash);
  if (!valid) return null;

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
