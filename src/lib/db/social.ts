import { getDatabase, isMongoConfigured } from "../mongodb";
import { ObjectId } from "mongodb";

export interface SocialAccountRecord {
  _id: string;
  userId: string;
  provider: "instagram";
  accountId: string;
  accountName: string;
  accountUsername: string;
  accessToken?: string;
  isSandbox: boolean;
  connectedAt: Date;
  updatedAt: Date;
}

export type ScheduledPostStatus = "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED";

export interface ScheduledPostRecord {
  _id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  videoUrl: string;
  caption: string;
  scheduledFor: Date;
  publishedAt?: Date;
  status: ScheduledPostStatus;
  instagramMediaId?: string;
  instagramPermalink?: string;
  errorMessage?: string;
  createdAt: Date;
}

// Memory fallbacks for local dev without Mongo
const memoryAccounts = new Map<string, SocialAccountRecord>();
const memoryScheduledPosts = new Map<string, ScheduledPostRecord>();

export async function getSocialAccount(userId: string): Promise<SocialAccountRecord | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const doc = await db.collection("social_accounts").findOne({ userId });
        if (doc) {
          return {
            ...doc,
            _id: doc._id.toString(),
          } as SocialAccountRecord;
        }
      }
    } catch (err) {
      console.warn("MongoDB getSocialAccount error:", err);
    }
  }

  return memoryAccounts.get(userId) || null;
}

export async function saveSocialAccount(
  userId: string,
  accountData: {
    accountId?: string;
    accountName?: string;
    accountUsername?: string;
    accessToken?: string;
    isSandbox?: boolean;
  }
): Promise<SocialAccountRecord> {
  const now = new Date();
  const accountId = accountData.accountId || "17841405309211844";
  const accountName = accountData.accountName || "VidyaMotion Official";
  const accountUsername = accountData.accountUsername || "vidyamotion.reels";
  const isSandbox = accountData.isSandbox ?? (!accountData.accessToken);

  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const updateDoc = {
          userId,
          provider: "instagram",
          accountId,
          accountName,
          accountUsername,
          accessToken: accountData.accessToken || "",
          isSandbox,
          updatedAt: now,
        };

        const result = await db.collection("social_accounts").findOneAndUpdate(
          { userId },
          { $set: updateDoc, $setOnInsert: { connectedAt: now } },
          { upsert: true, returnDocument: "after" }
        );

        if (result) {
          return {
            ...result,
            _id: result._id.toString(),
          } as SocialAccountRecord;
        }
      }
    } catch (err) {
      console.warn("MongoDB saveSocialAccount error, using memory fallback:", err);
    }
  }

  const existing = memoryAccounts.get(userId);
  const record: SocialAccountRecord = {
    _id: existing?._id || new ObjectId().toString(),
    userId,
    provider: "instagram",
    accountId,
    accountName,
    accountUsername,
    accessToken: accountData.accessToken || "",
    isSandbox,
    connectedAt: existing?.connectedAt || now,
    updatedAt: now,
  };
  memoryAccounts.set(userId, record);
  return record;
}

export async function createScheduledPost(data: {
  userId: string;
  projectId: string;
  projectTitle: string;
  videoUrl: string;
  caption: string;
  scheduledFor: Date;
}): Promise<ScheduledPostRecord> {
  const now = new Date();

  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const doc = {
          ...data,
          status: "PENDING" as ScheduledPostStatus,
          createdAt: now,
        };
        const res = await db.collection("scheduled_posts").insertOne(doc);
        return {
          _id: res.insertedId.toString(),
          ...doc,
        };
      }
    } catch (err) {
      console.warn("MongoDB createScheduledPost error:", err);
    }
  }

  const id = new ObjectId().toString();
  const record: ScheduledPostRecord = {
    _id: id,
    ...data,
    status: "PENDING",
    createdAt: now,
  };
  memoryScheduledPosts.set(id, record);
  return record;
}

export async function listScheduledPosts(userId: string): Promise<ScheduledPostRecord[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        const docs = await db
          .collection("scheduled_posts")
          .find({ userId })
          .sort({ scheduledFor: 1 })
          .toArray();
        return docs.map((d) => ({
          ...d,
          _id: d._id.toString(),
        })) as ScheduledPostRecord[];
      }
    } catch (err) {
      console.warn("MongoDB listScheduledPosts error:", err);
    }
  }

  return Array.from(memoryScheduledPosts.values())
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export async function updateScheduledPostStatus(
  postId: string,
  status: ScheduledPostStatus,
  extra?: {
    instagramMediaId?: string;
    instagramPermalink?: string;
    errorMessage?: string;
  }
): Promise<boolean> {
  const now = new Date();
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = {};
        if (ObjectId.isValid(postId)) q._id = new ObjectId(postId);
        else q._id = postId;

        const updateSet: Record<string, unknown> = {
          status,
          updatedAt: now,
          ...(extra || {}),
        };
        if (status === "PUBLISHED") {
          updateSet.publishedAt = now;
        }

        await db.collection("scheduled_posts").updateOne(q, { $set: updateSet });
        return true;
      }
    } catch (err) {
      console.warn("MongoDB updateScheduledPostStatus error:", err);
    }
  }

  const p = memoryScheduledPosts.get(postId);
  if (p) {
    p.status = status;
    if (extra?.instagramMediaId) p.instagramMediaId = extra.instagramMediaId;
    if (extra?.instagramPermalink) p.instagramPermalink = extra.instagramPermalink;
    if (extra?.errorMessage) p.errorMessage = extra.errorMessage;
    if (status === "PUBLISHED") p.publishedAt = now;
    return true;
  }
  return false;
}

export async function deleteScheduledPost(userId: string, postId: string): Promise<boolean> {
  if (isMongoConfigured()) {
    try {
      const db = await getDatabase();
      if (db) {
        let q: Record<string, unknown> = { userId };
        if (ObjectId.isValid(postId)) q._id = new ObjectId(postId);
        else q._id = postId;

        await db.collection("scheduled_posts").deleteOne(q);
        return true;
      }
    } catch (err) {
      console.warn("MongoDB deleteScheduledPost error:", err);
    }
  }

  const p = memoryScheduledPosts.get(postId);
  if (p && p.userId === userId) {
    memoryScheduledPosts.delete(postId);
    return true;
  }
  return false;
}
