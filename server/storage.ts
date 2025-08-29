import { 
  type User, type InsertUser, type UpsertUser,
  type Track, type InsertTrack,
  type Battle, type InsertBattle,
  type Beat, type InsertBeat,
  type Collaboration, type InsertCollaboration,
  type Vote, type InsertVote,
  type File, type InsertFile,
  users, tracks, battles, beats, collaborations, votes, files
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  // Replit Auth operation
  upsertUser(userData: UpsertUser): Promise<User>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getTrackCount(): Promise<number>;
  getBattleCount(): Promise<number>;
  getBeatCount(): Promise<number>;
  getRecentActivity(): Promise<any[]>;
  deleteUser(id: string): Promise<boolean>;
  deleteTrack(id: string): Promise<boolean>;
  deleteBattle(id: string): Promise<boolean>;
  
  // Authentication operations
  authenticateUser(username: string, password: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  
  // Track operations
  getTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  getTracksByArtist(artistId: string): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  
  // Battle operations
  getBattles(): Promise<Battle[]>;
  getActiveBattles(): Promise<Battle[]>;
  getBattle(id: string): Promise<Battle | undefined>;
  getBattlesByUser(userId: string): Promise<Battle[]>;
  createBattle(battle: InsertBattle): Promise<Battle>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined>;
  
  // Beat operations
  getBeats(): Promise<Beat[]>;
  getBeat(id: string): Promise<Beat | undefined>;
  getBeatsByProducer(producerId: string): Promise<Beat[]>;
  getBeatsByGenre(genre: string): Promise<Beat[]>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: string, updates: Partial<Beat>): Promise<Beat | undefined>;
  
  // Collaboration operations
  getCollaborations(): Promise<Collaboration[]>;
  getCollaborationsByTrack(trackId: string): Promise<Collaboration[]>;
  getCollaborationsByUser(userId: string): Promise<Collaboration[]>;
  createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration>;
  updateCollaboration(id: string, updates: Partial<Collaboration>): Promise<Collaboration | undefined>;
  
  // Vote operations
  getVotesByBattle(battleId: string): Promise<Vote[]>;
  getUserVoteForBattle(battleId: string, userId: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  
  // File operations
  getFiles(): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  getFilesByDirectory(directory: string): Promise<File[]>;
  getFilesByType(fileType: string): Promise<File[]>;
  getFilesByUser(userId: string): Promise<File[]>;
  getFilesByEntity(entityType: string, entityId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, updates: Partial<File>): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tracks: Map<string, Track>;
  private battles: Map<string, Battle>;
  private beats: Map<string, Beat>;
  private collaborations: Map<string, Collaboration>;
  private votes: Map<string, Vote>;
  private files: Map<string, File>;

  constructor() {
    this.users = new Map();
    this.tracks = new Map();
    this.battles = new Map();
    this.beats = new Map();
    this.collaborations = new Map();
    this.votes = new Map();
    this.files = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = insertUser.password ? await this.hashPassword(insertUser.password) : null;
    const user: User = { 
      ...insertUser,
      username: insertUser.username || null,
      email: insertUser.email || null,
      password: hashedPassword,
      id,
      role: insertUser.role || "fan",
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      displayName: insertUser.displayName || 'User',
      bio: insertUser.bio || null,
      avatar: insertUser.avatar || null,
      followers: 0,
      following: 0,
      isAdult: insertUser.isAdult || true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Replit Auth upsert operation for MemStorage
  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }
    
    const displayName = userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : userData.firstName || userData.email?.split('@')[0] || 'User';
    
    try {
      // First try to find existing user by ID (primary) or email (secondary)
      let existingUser = this.users.get(userData.id);
      
      // If not found by ID, check by email for account linking
      if (!existingUser && userData.email) {
        existingUser = Array.from(this.users.values()).find(user => user.email === userData.email);
      }
      
      if (existingUser) {
        // Update existing user while preserving important fields
        console.log(`Updating existing user: ${existingUser.id} (${existingUser.displayName})`);
        
        const updatedUser = { 
          ...existingUser,
          // Update profile information from Replit
          email: userData.email || existingUser.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
          displayName,
          updatedAt: new Date(),
          // Preserve existing user data
          role: existingUser.role, // Don't change existing role
          username: existingUser.username, // Preserve username if set
          bio: existingUser.bio, // Preserve bio
          followers: existingUser.followers,
          following: existingUser.following,
        };
        this.users.set(existingUser.id, updatedUser);
        return updatedUser;
      } else {
        // Create new user with default settings
        console.log(`Creating new user: ${userData.id} (${displayName})`);
        
        const user: User = {
          id: userData.id,
          username: null, // Will be set later by user
          email: userData.email || null,
          password: null, // Not used with Replit auth
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null,
          role: "fan", // Default role for new users
          displayName,
          bio: null,
          avatar: null,
          followers: 0,
          following: 0,
          isAdult: true,
          createdAt: new Date(),
          updatedAt: userData.updatedAt || new Date()
        };
        this.users.set(userData.id, user);
        return user;
      }
    } catch (error) {
      console.error('Error in upsertUser (MemStorage):', error);
      throw error;
    }
  }

  // Authentication operations
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username) || await this.getUserByEmail(username);
    if (!user || !user.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Track operations
  async getTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTrack(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(track => track.artistId === artistId);
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = randomUUID();
    const track: Track = { 
      ...insertTrack, 
      id,
      duration: insertTrack.duration || null,
      coverImage: insertTrack.coverImage || null,
      genre: insertTrack.genre || null,
      bpm: insertTrack.bpm || null,
      plays: 0,
      likes: 0,
      isCollaborative: insertTrack.isCollaborative || false,
      collaborators: insertTrack.collaborators || null,
      createdAt: new Date()
    };
    this.tracks.set(id, track);
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    const updatedTrack = { ...track, ...updates };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  // Battle operations
  async getBattles(): Promise<Battle[]> {
    return Array.from(this.battles.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveBattles(): Promise<Battle[]> {
    return Array.from(this.battles.values()).filter(battle => battle.status === 'active');
  }

  async getBattlesByUser(userId: string): Promise<Battle[]> {
    return Array.from(this.battles.values())
      .filter(battle => battle.contestant1Id === userId || battle.contestant2Id === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    return this.battles.get(id);
  }

  async createBattle(insertBattle: InsertBattle): Promise<Battle> {
    const id = randomUUID();
    const battle: Battle = { 
      ...insertBattle, 
      id,
      contestant1Track: null,
      contestant2Track: null,
      contestant1Votes: 0,
      contestant2Votes: 0,
      status: "active",
      totalVotes: 0,
      views: 0,
      endTime: insertBattle.endTime || null,
      createdAt: new Date()
    };
    this.battles.set(id, battle);
    return battle;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    const battle = this.battles.get(id);
    if (!battle) return undefined;
    const updatedBattle = { ...battle, ...updates };
    this.battles.set(id, updatedBattle);
    return updatedBattle;
  }

  // Beat operations
  async getBeats(): Promise<Beat[]> {
    return Array.from(this.beats.values()).filter(beat => beat.isAvailable);
  }

  async getBeat(id: string): Promise<Beat | undefined> {
    return this.beats.get(id);
  }

  async getBeatsByProducer(producerId: string): Promise<Beat[]> {
    return Array.from(this.beats.values()).filter(beat => beat.producerId === producerId);
  }

  async getBeatsByGenre(genre: string): Promise<Beat[]> {
    return Array.from(this.beats.values()).filter(beat => beat.genre === genre);
  }

  async createBeat(insertBeat: InsertBeat): Promise<Beat> {
    const id = randomUUID();
    const beat: Beat = { 
      ...insertBeat, 
      id,
      coverImage: insertBeat.coverImage || null,
      tags: insertBeat.tags || null,
      plays: 0,
      likes: 0,
      purchases: 0,
      isAvailable: true,
      createdAt: new Date()
    };
    this.beats.set(id, beat);
    return beat;
  }

  async updateBeat(id: string, updates: Partial<Beat>): Promise<Beat | undefined> {
    const beat = this.beats.get(id);
    if (!beat) return undefined;
    const updatedBeat = { ...beat, ...updates };
    this.beats.set(id, updatedBeat);
    return updatedBeat;
  }

  // Collaboration operations
  async getCollaborations(): Promise<Collaboration[]> {
    return Array.from(this.collaborations.values());
  }

  async getCollaborationsByTrack(trackId: string): Promise<Collaboration[]> {
    return Array.from(this.collaborations.values()).filter(collab => collab.trackId === trackId);
  }

  async getCollaborationsByUser(userId: string): Promise<Collaboration[]> {
    return Array.from(this.collaborations.values()).filter(
      collab => collab.initiatorId === userId || collab.collaboratorId === userId
    );
  }

  async createCollaboration(insertCollaboration: InsertCollaboration): Promise<Collaboration> {
    const id = randomUUID();
    const collaboration: Collaboration = { 
      ...insertCollaboration, 
      id,
      trackId: insertCollaboration.trackId || null,
      description: insertCollaboration.description || null,
      status: "pending",
      createdAt: new Date()
    };
    this.collaborations.set(id, collaboration);
    return collaboration;
  }

  async updateCollaboration(id: string, updates: Partial<Collaboration>): Promise<Collaboration | undefined> {
    const collaboration = this.collaborations.get(id);
    if (!collaboration) return undefined;
    const updatedCollaboration = { ...collaboration, ...updates };
    this.collaborations.set(id, updatedCollaboration);
    return updatedCollaboration;
  }

  // Vote operations
  async getVotesByBattle(battleId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(vote => vote.battleId === battleId);
  }

  async getUserVoteForBattle(battleId: string, userId: string): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      vote => vote.battleId === battleId && vote.userId === userId
    );
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = randomUUID();
    const vote: Vote = { 
      ...insertVote, 
      id,
      createdAt: new Date()
    };
    this.votes.set(id, vote);
    return vote;
  }

  // File operations
  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.status === 'active')
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getFile(id: string): Promise<File | undefined> {
    const file = this.files.get(id);
    return file?.status === 'active' ? file : undefined;
  }

  async getFilesByDirectory(directory: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.directory === directory && file.status === 'active'
    );
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.fileType === fileType && file.status === 'active'
    );
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.uploadedBy === userId && file.status === 'active'
    );
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.relatedEntityType === entityType && 
              file.relatedEntityId === entityId && 
              file.status === 'active'
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = { 
      ...insertFile,
      isPublic: insertFile.isPublic || false,
      id,
      metadata: insertFile.metadata || null,
      relatedEntityType: insertFile.relatedEntityType || null,
      relatedEntityId: insertFile.relatedEntityId || null,
      checksum: insertFile.checksum || null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file || file.status !== 'active') return undefined;
    const updatedFile = { ...file, ...updates, updatedAt: new Date() };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) return false;
    const deletedFile = { ...file, status: "deleted", updatedAt: new Date() };
    this.files.set(id, deletedFile);
    return true;
  }

  // Admin operations for MemStorage
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getTrackCount(): Promise<number> {
    return this.tracks.size;
  }

  async getBattleCount(): Promise<number> {
    return this.battles.size;
  }

  async getBeatCount(): Promise<number> {
    return this.beats.size;
  }

  async getRecentActivity(): Promise<any[]> {
    const recentTracks = Array.from(this.tracks.values()).slice(-5);
    const recentBattles = Array.from(this.battles.values()).slice(-5);
    return [
      ...recentTracks.map(track => ({ type: 'track', data: track })),
      ...recentBattles.map(battle => ({ type: 'battle', data: battle }))
    ];
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async deleteTrack(id: string): Promise<boolean> {
    return this.tracks.delete(id);
  }

  async deleteBattle(id: string): Promise<boolean> {
    return this.battles.delete(id);
  }
}

// DatabaseStorage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  // Authentication operations
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username) || await this.getUserByEmail(username);
    if (!user || !user.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = insertUser.password ? await this.hashPassword(insertUser.password) : null;
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Replit Auth upsert operation
  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }
    
    const displayName = userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : userData.firstName || userData.email?.split('@')[0] || 'User';
    
    try {
      // First, try to find existing user by ID (primary) or email (secondary)
      let existingUser: User | undefined;
      
      // Check by ID first as it's more reliable
      if (userData.id) {
        existingUser = await this.getUser(userData.id);
      }
      
      // If not found by ID, check by email for account linking
      if (!existingUser && userData.email) {
        existingUser = await this.getUserByEmail(userData.email);
      }
      
      if (existingUser) {
        // Update existing user while preserving important fields
        console.log(`Updating existing user: ${existingUser.id} (${existingUser.displayName})`);
        
        const [user] = await db
          .update(users)
          .set({
            // Update profile information from Replit
            email: userData.email || existingUser.email,
            firstName: userData.firstName || existingUser.firstName,
            lastName: userData.lastName || existingUser.lastName,
            profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
            displayName,
            updatedAt: new Date(),
            // Preserve existing user data
            role: existingUser.role, // Don't change existing role
            username: existingUser.username, // Preserve username if set
            bio: existingUser.bio, // Preserve bio
            followers: existingUser.followers,
            following: existingUser.following,
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return user;
      } else {
        // Create new user with default settings
        console.log(`Creating new user: ${userData.id} (${displayName})`);
        
        const [user] = await db
          .insert(users)
          .values({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            displayName,
            username: null, // Will be set later by user
            password: null, // Not used with Replit auth
            role: 'fan', // Default role for new users
            bio: null,
            avatar: null,
            followers: 0,
            following: 0,
            isAdult: true,
            createdAt: new Date(),
            updatedAt: userData.updatedAt || new Date(),
          })
          .returning();
        return user;
      }
    } catch (error) {
      console.error('Error in upsertUser:', error);
      throw error;
    }
  }

  // Track operations
  async getTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    return await db.select().from(tracks).where(eq(tracks.artistId, artistId));
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db.insert(tracks).values(track).returning();
    return newTrack;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set(updates)
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }

  // Battle operations
  async getBattles(): Promise<Battle[]> {
    return await db.select().from(battles);
  }

  async getActiveBattles(): Promise<Battle[]> {
    return await db.select().from(battles).where(eq(battles.status, 'active'));
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const [battle] = await db.select().from(battles).where(eq(battles.id, id));
    return battle || undefined;
  }

  async getBattlesByUser(userId: string): Promise<Battle[]> {
    return await db.select().from(battles).where(
      or(eq(battles.contestant1Id, userId), eq(battles.contestant2Id, userId))
    );
  }

  async createBattle(battle: InsertBattle): Promise<Battle> {
    const [newBattle] = await db.insert(battles).values(battle).returning();
    return newBattle;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    const [battle] = await db
      .update(battles)
      .set(updates)
      .where(eq(battles.id, id))
      .returning();
    return battle || undefined;
  }

  // Beat operations
  async getBeats(): Promise<Beat[]> {
    return await db.select().from(beats);
  }

  async getBeat(id: string): Promise<Beat | undefined> {
    const [beat] = await db.select().from(beats).where(eq(beats.id, id));
    return beat || undefined;
  }

  async getBeatsByProducer(producerId: string): Promise<Beat[]> {
    return await db.select().from(beats).where(eq(beats.producerId, producerId));
  }

  async getBeatsByGenre(genre: string): Promise<Beat[]> {
    return await db.select().from(beats).where(eq(beats.genre, genre));
  }

  async createBeat(beat: InsertBeat): Promise<Beat> {
    const [newBeat] = await db.insert(beats).values(beat).returning();
    return newBeat;
  }

  async updateBeat(id: string, updates: Partial<Beat>): Promise<Beat | undefined> {
    const [beat] = await db
      .update(beats)
      .set(updates)
      .where(eq(beats.id, id))
      .returning();
    return beat || undefined;
  }

  // Collaboration operations
  async getCollaborations(): Promise<Collaboration[]> {
    return await db.select().from(collaborations);
  }

  async getCollaborationsByTrack(trackId: string): Promise<Collaboration[]> {
    return await db.select().from(collaborations).where(eq(collaborations.trackId, trackId));
  }

  async getCollaborationsByUser(userId: string): Promise<Collaboration[]> {
    return await db.select().from(collaborations).where(
      or(eq(collaborations.initiatorId, userId), eq(collaborations.collaboratorId, userId))
    );
  }

  async createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration> {
    const [newCollaboration] = await db.insert(collaborations).values(collaboration).returning();
    return newCollaboration;
  }

  async updateCollaboration(id: string, updates: Partial<Collaboration>): Promise<Collaboration | undefined> {
    const [collaboration] = await db
      .update(collaborations)
      .set(updates)
      .where(eq(collaborations.id, id))
      .returning();
    return collaboration || undefined;
  }

  // Vote operations
  async getVotesByBattle(battleId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.battleId, battleId));
  }

  async getUserVoteForBattle(battleId: string, userId: string): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(
      and(eq(votes.battleId, battleId), eq(votes.userId, userId))
    );
    return vote || undefined;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    return newVote;
  }

  // File operations  
  async getFiles(): Promise<File[]> {
    return await db.select().from(files);
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByDirectory(directory: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.directory, directory));
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.fileType, fileType));
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.uploadedBy, userId));
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<File[]> {
    return await db.select().from(files).where(
      and(eq(files.relatedEntityType, entityType), eq(files.relatedEntityId, entityId))
    );
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values({
      ...file,
      isPublic: file.isPublic || false
    }).returning();
    return newFile;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const [file] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async deleteFile(id: string): Promise<boolean> {
    const result = await db
      .update(files)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(files.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Admin operations for DatabaseStorage
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getTrackCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(tracks);
    return result[0].count;
  }

  async getBattleCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(battles);
    return result[0].count;
  }

  async getBeatCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(beats);
    return result[0].count;
  }

  async getRecentActivity(): Promise<any[]> {
    const recentTracks = await db.select().from(tracks).limit(5);
    const recentBattles = await db.select().from(battles).limit(5);
    return [
      ...recentTracks.map(track => ({ type: 'track', data: track })),
      ...recentBattles.map(battle => ({ type: 'battle', data: battle }))
    ];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteTrack(id: string): Promise<boolean> {
    const result = await db.delete(tracks).where(eq(tracks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteBattle(id: string): Promise<boolean> {
    const result = await db.delete(battles).where(eq(battles.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();
