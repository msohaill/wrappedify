import express from 'express';

import { createServer } from 'http';

import bodyParser from 'body-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import env from './env.js';
import logger from './lib/logger/index.js';
import SpotifyClient from './lib/spotify/index.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import loggerMiddleware from './middlewares/logger.middleware.js';
import listeningController from './modules/listening/listening.controller.js';
import { handleSocket } from './modules/listening/listening.service.js';

(async () => {
  const app = express();

  app.use(cors({ credentials: true, origin: true }));
  app.use(bodyParser.json({ limit: '16mb' }));
  app.use(loggerMiddleware);

  const http = createServer(app);
  const io = new Server(http, { cors: { origin: true, credentials: true } });

  await SpotifyClient.connect();

  app.use('/listening', listeningController);

  http.listen(env.port, () => {
    console.log(`🐳 Server is running at http://localhost:${env.port}`);
  });

  io.on('connection', socket => {
    logger.info('New client connected');
    handleSocket(socket);
    socket.on('disconnect', () => logger.info('User disconnected.'));
  });

  app.use(errorHandlerMiddleware);
})();
