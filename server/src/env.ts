import { config } from 'dotenv';

config();

export default {
  port: process.env.PORT || '8080',
  spotify: {
    clientId: process.env.CLIENT_ID as string,
    clientSecret: process.env.CLIENT_SECRET as string,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
};
