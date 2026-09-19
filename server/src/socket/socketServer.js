import { Server } from 'socket.io';
import { GameEngine } from '../game/GameEngine.js';
import { roomManager } from '../game/RoomManager.js';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';

export function initializeSocketServer(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const gameEngine = new GameEngine(io);

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // Register Domain Handlers
    registerRoomHandlers(io, socket, gameEngine);
    registerGameHandlers(io, socket, gameEngine);

    // Handle Disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket Disconnected] ID: ${socket.id} | Reason: ${reason}`);
      const result = roomManager.handleDisconnect(socket.id);
      if (result) {
        const { room } = result;
        gameEngine.broadcastState(room);
      }
    });
  });

  return io;
}