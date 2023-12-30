import express from 'express';

import { createServer } from 'http';

import cors from 'cors';
import bodyParser from 'body-parser';
import env from './env';

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json({ limit: '16mb' }));

const http = createServer(app);

app.get('/', (req, res) => res.send('Server is Live'));

http.listen(env.port, () => {
  console.log(`🐳 Server is running at http://localhost:${env.port}`);
});
