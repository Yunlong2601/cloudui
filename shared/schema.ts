import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  serial,
  integer,
} from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  requires2FA: boolean("requires_2fa").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertChatRoom = Omit<typeof chatRooms.$inferInsert, 'id' | 'createdAt'>;
export type ChatRoom = typeof chatRooms.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id),
  userId: varchar("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertChatMessage = Omit<typeof chatMessages.$inferInsert, 'id' | 'createdAt'>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const chat2FACodes = pgTable("chat_2fa_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  roomId: integer("room_id").references(() => chatRooms.id),
  code: varchar("code", { length: 6 }).notNull(),
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertChat2FACode = Omit<typeof chat2FACodes.$inferInsert, 'id' | 'createdAt'>;
export type Chat2FACode = typeof chat2FACodes.$inferSelect;
