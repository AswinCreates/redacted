import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma.js';
import { wordBank } from './game/WordBank.js';
import { initializeSocketServer } from './socket/socketServer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Initialize Socket Server Wiring
initializeSocketServer(httpServer, CLIENT_URL);

wordBank.initialize().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});