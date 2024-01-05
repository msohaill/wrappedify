import express from 'express';

import { createServer } from 'http';

import bodyParser from 'body-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import env from './env';
import logger from './lib/logger';
import SpotifyClient from './lib/spotify';
import errorHandlerMiddleware from './middlewares/error-handler.middleware';
import loggerMiddleware from './middlewares/logger.middleware';
import listeningController from './modules/listening/listening.controller';
import { handleSocket } from './modules/listening/listening.service';

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
