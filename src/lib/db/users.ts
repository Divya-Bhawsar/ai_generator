import { getDatabase, isMongoConfigured } from "../mongodb";
import { hashPassword, verifyPassword } from "../auth";
import { ObjectId } from "mongodb";

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

// In-memory fallback cache for local dev when MONGODB_URI is not yet provided
const memoryUsers = new Map<string, UserRecord>();

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<UserProfile> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);
  const now = new Date();
  const name = data.name?.trim() || normalizedEmail.split("@")[0];

  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        // Ensure unique index
        await db.collection("users").createIndex({ email: 1 }, { unique: true });

        const doc = {
          email: normalizedEmail,
          passwordHash,
          name,
          createdAt: now,
          updatedAt: now,
        };

        const result = await db.collection("users").insertOne(doc);
        return {
          id: result.insertedId.toString(),
          email: normalizedEmail,
          name,
          createdAt: now,
        };
      }
    } catch (err: unknown) {
      console.warn("MongoDB insert error, using local fallback store:", err);
    }
  }

  // Fallback in-memory store
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
    try {
      const db = await getDatabase();
      if (db) {
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
    } catch (err: unknown) {
      console.warn("MongoDB query error, falling back to local memory:", err);
    }
  }

  return memoryUsers.get(normalizedEmail) || null;
}

export async function findUserById(id: string): Promise<UserProfile | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
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
    } catch (err: unknown) {
      console.warn("MongoDB query by ID error:", err);
    }
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
