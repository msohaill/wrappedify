import express from 'express';
import { logger } from 'express-winston';
import { format, transports } from 'winston';

export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return logger({
    transports: [
      new transports.Console({
        format: format.combine(format.timestamp(), format.json()),
      }),
    ],
    level: 'info',
    meta: true,
    metaField: 'meta',
    msg: 'HTTP {{req.method}} {{req.url}}',
  })(req, res, next);
};
