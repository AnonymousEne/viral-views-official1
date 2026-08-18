// Extend WebSocket type to allow userId property
declare module 'ws' {
  interface WebSocket {
    userId?: string;
  }
}


import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import mimeTypes from "mime-types";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
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
  // Hardened: Audio upload with Zod validation and error handling
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
      await writeFile(filepath, file.buffer);
      // Validate file data
      let fileData;
      try {
        fileData = insertFileSchema.parse({
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
      } catch (err) {
        return res.status(400).json({ error: "Invalid file data" });
      }
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

  // Hardened: Video upload with Zod validation and error handling
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
      await writeFile(filepath, file.buffer);
      // Validate file data
      let fileData;
      try {
        fileData = insertFileSchema.parse({
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
      } catch (err) {
        return res.status(400).json({ error: "Invalid file data" });
      }
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

  // Hardened: Image upload with Zod validation and error handling
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
      await writeFile(filepath, file.buffer);
      // Validate file data
      let fileData;
      try {
        fileData = insertFileSchema.parse({
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
      } catch (err) {
        return res.status(400).json({ error: "Invalid file data" });
      }
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

  // Helper: Authenticate WebSocket connection using JWT token in query string
  function authenticateWebSocket(ws: WebSocket, req: any): { userId?: string, error?: string } {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (!token) return { error: 'Missing auth token' };
      // Replace 'your_jwt_secret' with your real secret or env var
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      return { userId: payload.sub };
    } catch (err) {
      return { error: 'Invalid or expired token' };
    }
  }

  wss.on('connection', (ws, req) => {
    // Authenticate connection
    const auth = authenticateWebSocket(ws, req);
    if (auth.error) {
      ws.send(JSON.stringify({ type: 'error', message: auth.error }));
      ws.close();
      return;
    }
    ws.userId = auth.userId;
    console.log(`WebSocket client connected: userId=${auth.userId}`);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Basic message validation
        if (!data.type) throw new Error('Missing message type');

        switch (data.type) {
          case 'join_battle':
            if (!data.battleId) throw new Error('Missing battleId');
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'battle_update',
                  battleId: data.battleId,
                  action: 'participant_joined',
                  userId: ws.userId
                }));
              }
            });
            break;
          case 'vote_cast':
            if (!data.battleId || !data.contestantId || typeof data.voteCount !== 'number') throw new Error('Invalid vote_cast payload');
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
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        let message = 'Invalid message';
        if (error instanceof Error) message = error.message;
        ws.send(JSON.stringify({ type: 'error', message }));
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: userId=${ws.userId}`);
    });
  });

  // ── Lyric Generator ──────────────────────────────────────────────────────
  const lyricRequestSchema = z.object({
    transcript:   z.string().max(4000).optional().default(""),
    genre:        z.string().max(60).optional().default("any"),
    mood:         z.string().max(60).optional().default("auto-detect"),
    style:        z.string().max(60).optional().default("modern"),
    theme:        z.string().max(200).optional().default(""),
    extraContext: z.string().max(500).optional().default(""),
    bpm:          z.string().max(20).optional().default(""),
    rhymeScheme:  z.string().max(20).optional().default("AABB"),
  });

  app.post("/api/lyric-generator", async (req, res) => {
    const parsed = lyricRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
    }

    const { transcript, genre, mood, style, theme, extraContext, bpm, rhymeScheme } = parsed.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: "AI service not configured. Set ANTHROPIC_API_KEY." });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contextParts: string[] = [];
    if (transcript) contextParts.push(`AUDIO TRANSCRIPT / FREESTYLE INPUT:\n"${transcript}"`);
    if (genre !== "any") contextParts.push(`Genre: ${genre}`);
    if (mood !== "auto-detect") contextParts.push(`Mood/Vibe: ${mood}`);
    if (style !== "modern") contextParts.push(`Style: ${style}`);
    if (theme) contextParts.push(`Core Theme: ${theme}`);
    if (bpm) contextParts.push(`BPM/Tempo feel: ${bpm}`);
    if (extraContext) contextParts.push(`Additional context: ${extraContext}`);
    contextParts.push(`Rhyme scheme preference: ${rhymeScheme}`);

    const systemPrompt = `You are a world-class lyricist and songwriter with deep expertise across all genres — hip-hop, R&B, pop, soul, rock, trap, afrobeats, country, and beyond. You write lyrics that are emotionally powerful, culturally resonant, metaphor-rich, and highly original. Every song you write tells a story, creates vivid imagery, and has a memorable hook. You understand flow, cadence, syllable stress, internal rhymes, multisyllabic rhymes, and song structure deeply.`;

    const userPrompt = `${contextParts.length > 0 ? contextParts.join("\n") : "Create an original song with a compelling concept."}

Generate a FULL, POWERFUL, CREATIVE song with the following structure. Output EXACTLY in this format (use these exact section headers):

---SONG TITLE---
[A bold, evocative title]

---CONCEPT---
[2-3 sentences describing the song's story, emotional arc, and central metaphor]

---VERSE 1---
[8-12 lines — set the scene, introduce the protagonist and conflict. Use vivid imagery, strong verbs, and internal rhymes.]

---PRE-CHORUS---
[4-6 lines — emotional build-up that bridges the verse to the chorus. Rising tension.]

---CHORUS---
[6-8 lines — the emotional peak. Memorable, singable, hooky. The lines that stick in people's heads. Repeat-worthy.]

---VERSE 2---
[8-12 lines — deepen the story. New perspective, new details. Don't repeat Verse 1.]

---BRIDGE---
[4-8 lines — a dramatic tonal/emotional shift. Could be spoken word, a revelation, a breakdown, or the most raw/vulnerable moment.]

---OUTRO---
[4-6 lines — resolution or open ending. Can be a callback to the chorus or a final gut-punch line.]

---DELIVERY NOTES---
[3-5 bullet points on vocal performance: pacing, emphasis, breath points, tone shifts, ad-libs]

---RHYME MAP---
[Show the rhyme scheme of the chorus using ABAB notation or similar]

Make every single word count. No filler lines. Every verse should feel inevitable and surprising at the same time.`;

    // SSE streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      stream.on("text", (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      await stream.finalMessage();
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("Lyric generator error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message ?? "Generation failed" })}\n\n`);
      res.end();
    }
  });

  return httpServer;
}