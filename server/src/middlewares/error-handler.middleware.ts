import express from 'express';
import logger from '../lib/logger';

export default (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  logger.error(err.name, { url: req.url, message: err.message });
  res.status(500).json({
    type: 'InternalServerError',
    title: err.message,
    detail: 'Something went wrong. Please try again later.',
    meta: {},
  });
  next();
};
