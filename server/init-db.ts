import 'dotenv/config';
import { db } from './db.js';
import { users, tracks, battles, beats } from './sqlite-schema.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

async function initDatabase() {
  try {
    console.log('Initializing SQLite database...');
    
    // Create tables manually since we don't have migrations set up
    console.log('Creating database tables...');
    
    const sqlite = db.$client;
    
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role TEXT NOT NULL DEFAULT 'fan',
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar TEXT,
        followers INTEGER DEFAULT 0,
        following INTEGER DEFAULT 0,
        is_adult INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create tracks table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist_id TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        cover_image TEXT,
        duration INTEGER,
        genre TEXT,
        bpm INTEGER,
        plays INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        is_collaborative INTEGER DEFAULT 0,
        collaborators TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create battles table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS battles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        creator_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        start_time INTEGER DEFAULT (unixepoch()),
        end_time INTEGER,
        prize TEXT,
        participants TEXT,
        votes TEXT,
        winner TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create beats table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS beats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        producer_id TEXT NOT NULL,
        producer_name TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        cover_image TEXT,
        bpm INTEGER,
        key TEXT,
        genre TEXT,
        price REAL DEFAULT 0,
        tags TEXT,
        plays INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        is_exclusive INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    console.log('Tables created successfully!');
    
    // Create some sample data for development
    console.log('Creating sample data...');
    
    // Sample user
    const sampleUser = {
      id: 'user-1',
      username: 'demo_artist',
      email: 'demo@example.com',
      displayName: 'Demo Artist',
      role: 'artist',
      bio: 'A sample artist for development',
      followers: 100,
      following: 50,
    };
    
    try {
      await db.insert(users).values(sampleUser);
      console.log('Sample user created');
    } catch (e) {
      console.log('Sample user already exists');
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
