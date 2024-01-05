import { config } from 'dotenv';

config();

export default {
  port: Number.parseInt(process.env.PORT || '8080'),
  spotify: {
    clientId: process.env.CLIENT_ID || 'clientId',
    clientSecret: process.env.CLIENT_SECRET || 'clientSecret',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
  },
};
