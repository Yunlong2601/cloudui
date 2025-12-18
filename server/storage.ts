import {
  users,
  chatRooms,
  chatMessages,
  chat2FACodes,
  type User,
  type UpsertUser,
  type ChatRoom,
  type InsertChatRoom,
  type ChatMessage,
  type InsertChatMessage,
  type Chat2FACode,
  type InsertChat2FACode,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, gt, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;

  getChatMessages(roomId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  create2FACode(code: InsertChat2FACode): Promise<Chat2FACode>;
  verify2FACode(userId: string, roomId: number, code: string): Promise<boolean>;
  getValid2FAVerification(userId: string, roomId: number): Promise<Chat2FACode | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms);
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const [newRoom] = await db.insert(chatRooms).values(room).returning();
    return newRoom;
  }

  async getChatMessages(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async create2FACode(codeData: InsertChat2FACode): Promise<Chat2FACode> {
    const [code] = await db.insert(chat2FACodes).values(codeData).returning();
    return code;
  }

  async verify2FACode(userId: string, roomId: number, code: string): Promise<boolean> {
    const [existingCode] = await db
      .select()
      .from(chat2FACodes)
      .where(
        and(
          eq(chat2FACodes.userId, userId),
          eq(chat2FACodes.roomId, roomId),
          eq(chat2FACodes.code, code),
          eq(chat2FACodes.verified, false),
          gt(chat2FACodes.expiresAt, new Date())
        )
      );

    if (existingCode) {
      await db
        .update(chat2FACodes)
        .set({ verified: true })
        .where(eq(chat2FACodes.id, existingCode.id));
      return true;
    }
    return false;
  }

  async getValid2FAVerification(userId: string, roomId: number): Promise<Chat2FACode | undefined> {
    const [code] = await db
      .select()
      .from(chat2FACodes)
      .where(
        and(
          eq(chat2FACodes.userId, userId),
          eq(chat2FACodes.roomId, roomId),
          eq(chat2FACodes.verified, true),
          gt(chat2FACodes.expiresAt, new Date())
        )
      );
    return code;
  }
}

export const storage = new DatabaseStorage();
