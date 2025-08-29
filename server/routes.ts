import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import mimeTypes from "mime-types";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import express from "express";
import { 
  insertTrackSchema, 
  insertBattleSchema, 
  insertBeatSchema,
  insertCollaborationSchema,
  insertVoteSchema,
  insertFileSchema
} from "@shared/schema";
import { sendWelcomeEmail, reinitializeEmailService } from "./emailService";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Authentication
  await setupAuth(app);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow audio, video, and image files
      const allowedMimes = [
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type') as any);
      }
    }
  });

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Replit Auth routes (handled by setupAuth)
  // /api/login, /api/logout, /api/callback are configured in replitAuth.ts

  // Get current user for Replit Auth
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Legacy auth/me endpoint for compatibility
  app.get("/api/auth/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Failed to get user info:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // File upload endpoints
  app.post("/api/upload/audio", isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileExtension = extname(file.originalname);
      const timestamp = Date.now();
      const filename = `audio_${userId}_${timestamp}${fileExtension}`;
      const filepath = join(uploadsDir, filename);

      // Save file to local storage (uploads directory)
      await writeFile(filepath, file.buffer);

      // Create file record in database
      const fileData = insertFileSchema.parse({
        originalName: file.originalname,
        fileName: filename,
        filePath: `/uploads/${filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: 'audio',
        directory: 'tracks',
        uploadedBy: userId,
        isPublic: true
      });

      const savedFile = await storage.createFile(fileData);
      
      res.json({
        id: savedFile.id,
        filename: filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.mimetype
      });
    } catch (error) {
      console.error("Audio upload error:", error);
      res.status(500).json({ error: "Failed to upload audio file" });
    }
  });

  app.post("/api/upload/video", isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileExtension = extname(file.originalname);
      const timestamp = Date.now();
      const filename = `video_${userId}_${timestamp}${fileExtension}`;
      const filepath = join(uploadsDir, filename);

      // Save file to local storage
      await writeFile(filepath, file.buffer);

      // Create file record in database
      const fileData = insertFileSchema.parse({
        originalName: file.originalname,
        fileName: filename,
        filePath: `/uploads/${filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: 'video',
        directory: 'videos',
        uploadedBy: userId,
        isPublic: true
      });

      const savedFile = await storage.createFile(fileData);
      
      res.json({
        id: savedFile.id,
        filename: filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.mimetype
      });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: "Failed to upload video file" });
    }
  });

  app.post("/api/upload/image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileExtension = extname(file.originalname);
      const timestamp = Date.now();
      const filename = `image_${userId}_${timestamp}${fileExtension}`;
      const filepath = join(uploadsDir, filename);

      // Save file to local storage
      await writeFile(filepath, file.buffer);

      // Create file record in database
      const fileData = insertFileSchema.parse({
        originalName: file.originalname,
        fileName: filename,
        filePath: `/uploads/${filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: 'image',
        directory: 'covers',
        uploadedBy: userId,
        isPublic: true
      });

      const savedFile = await storage.createFile(fileData);
      
      res.json({
        id: savedFile.id,
        filename: filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.mimetype
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image file" });
    }
  });

  // User profile update
  app.patch("/api/users/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Admin middleware - now works with Replit auth
  function requireAdmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user.claims.sub;
    storage.getUser(userId).then(user => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin privileges required" });
      }
      req.user.dbUser = user;
      next();
    }).catch(() => {
      res.status(500).json({ error: "Failed to verify admin status" });
    });
  }

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const [userCount, trackCount, battleCount, beatCount] = await Promise.all([
        storage.getUserCount(),
        storage.getTrackCount(),
        storage.getBattleCount(),
        storage.getBeatCount()
      ]);
      
      res.json({
        users: userCount,
        tracks: trackCount,
        battles: battleCount,
        beats: beatCount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Track routes
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.getTrack(id);
      if (track) {
        res.json(track);
      } else {
        res.status(404).json({ error: "Track not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  app.post("/api/tracks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const trackData = insertTrackSchema.parse({
        ...req.body,
        artistId: userId,
        artistName: user.displayName || user.firstName + ' ' + user.lastName
      });
      
      const track = await storage.createTrack(trackData);
      res.json(track);
    } catch (error) {
      res.status(400).json({ error: "Invalid track data" });
    }
  });

  // Battle routes
  app.get("/api/battles", async (req, res) => {
    try {
      const battles = await storage.getBattles();
      res.json(battles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch battles" });
    }
  });

  app.get("/api/battles/active", async (req, res) => {
    try {
      const battles = await storage.getActiveBattles();
      res.json(battles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active battles" });
    }
  });

  app.post("/api/battles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const battleData = insertBattleSchema.parse({
        ...req.body,
        contestant1Id: userId,
        contestant1Name: user.displayName || user.firstName + ' ' + user.lastName
      });
      
      const battle = await storage.createBattle(battleData);
      res.json(battle);
    } catch (error) {
      res.status(400).json({ error: "Invalid battle data" });
    }
  });

  app.post("/api/battles/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { contestantId } = req.body;
      const userId = req.user.claims.sub;
      
      const voteData = insertVoteSchema.parse({
        battleId: id,
        userId,
        contestantId
      });
      
      const vote = await storage.createVote(voteData);
      res.json(vote);
    } catch (error) {
      res.status(400).json({ error: "Invalid vote data" });
    }
  });

  // Beat routes
  app.get("/api/beats", async (req, res) => {
    try {
      const beats = await storage.getBeats();
      res.json(beats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch beats" });
    }
  });

  app.post("/api/beats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const beatData = insertBeatSchema.parse({
        ...req.body,
        producerId: userId,
        producerName: user.displayName || user.firstName + ' ' + user.lastName
      });
      
      const beat = await storage.createBeat(beatData);
      res.json(beat);
    } catch (error) {
      res.status(400).json({ error: "Invalid beat data" });
    }
  });

  // Setup WebSocket server for real-time features
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'join_battle':
            // Broadcast to all clients about new battle participant
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'battle_update',
                  battleId: data.battleId,
                  action: 'participant_joined',
                  userId: data.userId
                }));
              }
            });
            break;

          case 'vote_cast':
            // Broadcast vote updates
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'vote_update',
                  battleId: data.battleId,
                  contestantId: data.contestantId,
                  voteCount: data.voteCount
                }));
              }
            });
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}