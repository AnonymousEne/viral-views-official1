import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User storage table - compatible with both custom auth and Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // Works for both UUIDs and Replit IDs
  username: text("username").unique(), // Keep for existing users, optional for Replit users
  email: text("email").unique(),
  password: text("password"), // Make optional - not needed for Replit users
  firstName: text("first_name"), // From Replit profile
  lastName: text("last_name"), // From Replit profile
  profileImageUrl: text("profile_image_url"), // From Replit profile
  role: text("role").notNull().default("fan"), // "artist", "producer", "fan", "admin"
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"), // Keep for backward compatibility
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  isAdult: boolean("is_adult").notNull().default(true), // Replit users are verified adults
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  artistName: text("artist_name").notNull(),
  audioUrl: text("audio_url").notNull(),
  coverImage: text("cover_image"),
  duration: integer("duration"), // in seconds
  genre: text("genre"),
  bpm: integer("bpm"),
  plays: integer("plays").default(0),
  likes: integer("likes").default(0),
  isCollaborative: boolean("is_collaborative").default(false),
  collaborators: text("collaborators").array(), // array of user IDs
  createdAt: timestamp("created_at").defaultNow(),
});

export const battles = pgTable("battles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  contestant1Id: varchar("contestant1_id").references(() => users.id).notNull(),
  contestant2Id: varchar("contestant2_id").references(() => users.id).notNull(),
  contestant1Name: text("contestant1_name").notNull(),
  contestant2Name: text("contestant2_name").notNull(),
  contestant1Track: text("contestant1_track"),
  contestant2Track: text("contestant2_track"),
  contestant1Votes: integer("contestant1_votes").default(0),
  contestant2Votes: integer("contestant2_votes").default(0),
  status: text("status").default("active"), // "active", "completed", "pending"
  category: text("category").notNull(), // "freestyle", "championship", "team", "open_mic"
  totalVotes: integer("total_votes").default(0),
  views: integer("views").default(0),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const beats = pgTable("beats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  producerId: varchar("producer_id").references(() => users.id).notNull(),
  producerName: text("producer_name").notNull(),
  audioUrl: text("audio_url").notNull(),
  coverImage: text("cover_image"),
  genre: text("genre").notNull(),
  bpm: integer("bpm").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  licenseType: text("license_type").notNull(), // "basic", "premium", "exclusive"
  plays: integer("plays").default(0),
  likes: integer("likes").default(0),
  purchases: integer("purchases").default(0),
  tags: text("tags").array(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collaborations = pgTable("collaborations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").references(() => tracks.id),
  trackTitle: text("track_title").notNull(),
  initiatorId: varchar("initiator_id").references(() => users.id).notNull(),
  initiatorName: text("initiator_name").notNull(),
  collaboratorId: varchar("collaborator_id").references(() => users.id).notNull(),
  collaboratorName: text("collaborator_name").notNull(),
  role: text("role").notNull(), // "lead", "featured", "producer", "writer"
  description: text("description"),
  status: text("status").default("pending"), // "pending", "active", "completed", "declined"
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  battleId: varchar("battle_id").references(() => battles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contestantId: varchar("contestant_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(),
  fileType: text("file_type").notNull(), // "audio", "image", "video", "document"
  directory: text("directory").notNull(), // "tracks", "beats", "avatars", "covers", "videos", "samples", "stems"
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false),
  metadata: jsonb("metadata"), // stores additional file info like duration, dimensions, etc.
  relatedEntityType: text("related_entity_type"), // "track", "beat", "battle", "user", "collaboration"
  relatedEntityId: varchar("related_entity_id"),
  checksum: text("checksum"), // for file integrity verification
  status: text("status").default("active"), // "active", "deleted", "archived"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// UpsertUser type for Replit Auth - used to create/update users from Replit claims
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  updatedAt: true,
}).extend({
  id: z.string(), // Make id required for upsert operations
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  displayName: true,
  bio: true,
  avatar: true,
  isAdult: true,
}).extend({
  role: z.enum(["artist", "producer", "fan", "admin"]).optional(),
  password: z.string().optional(), // Optional for Replit users
  username: z.string().optional(), // Optional for Replit users
});

export const insertTrackSchema = createInsertSchema(tracks).pick({
  title: true,
  artistId: true,
  artistName: true,
  audioUrl: true,
  coverImage: true,
  duration: true,
  genre: true,
  bpm: true,
  isCollaborative: true,
  collaborators: true,
});

export const insertBattleSchema = createInsertSchema(battles).pick({
  title: true,
  contestant1Id: true,
  contestant2Id: true,
  contestant1Name: true,
  contestant2Name: true,
  category: true,
  endTime: true,
});

export const insertBeatSchema = createInsertSchema(beats).pick({
  title: true,
  producerId: true,
  producerName: true,
  audioUrl: true,
  coverImage: true,
  genre: true,
  bpm: true,
  price: true,
  licenseType: true,
  tags: true,
});

export const insertCollaborationSchema = createInsertSchema(collaborations).pick({
  trackId: true,
  trackTitle: true,
  initiatorId: true,
  initiatorName: true,
  collaboratorId: true,
  collaboratorName: true,
  role: true,
  description: true,
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  battleId: true,
  userId: true,
  contestantId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  originalName: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  fileType: true,
  directory: true,
  uploadedBy: true,
  isPublic: true,
  metadata: true,
  relatedEntityType: true,
  relatedEntityId: true,
  checksum: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type InsertBeat = z.infer<typeof insertBeatSchema>;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type User = typeof users.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type Beat = typeof beats.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type File = typeof files.$inferSelect;
