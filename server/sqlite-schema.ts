import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

// User storage table 
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username"),
  email: text("email"),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("fan"),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  isAdult: integer("is_adult").notNull().default(1), // SQLite uses integers for booleans
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artistId: text("artist_id").notNull(),
  artistName: text("artist_name").notNull(),
  audioUrl: text("audio_url").notNull(),
  coverImage: text("cover_image"),
  duration: integer("duration"),
  genre: text("genre"),
  bpm: integer("bpm"),
  plays: integer("plays").default(0),
  likes: integer("likes").default(0),
  isCollaborative: integer("is_collaborative").default(0),
  collaborators: text("collaborators"), // JSON string for SQLite
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const battles = sqliteTable("battles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: text("creator_id").notNull(),
  status: text("status").notNull().default("active"),
  startTime: integer("start_time").default(sql`(unixepoch())`),
  endTime: integer("end_time"),
  prize: text("prize"),
  participants: text("participants"), // JSON string
  votes: text("votes"), // JSON string
  winner: text("winner"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const beats = sqliteTable("beats", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  producerId: text("producer_id").notNull(),
  producerName: text("producer_name").notNull(),
  audioUrl: text("audio_url").notNull(),
  coverImage: text("cover_image"),
  bpm: integer("bpm"),
  key: text("key"),
  genre: text("genre"),
  price: real("price").default(0),
  tags: text("tags"), // JSON string
  plays: integer("plays").default(0),
  likes: integer("likes").default(0),
  downloads: integer("downloads").default(0),
  isExclusive: integer("is_exclusive").default(0),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Mock data types for development
export type User = typeof users.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type Beat = typeof beats.$inferSelect;
