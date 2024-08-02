import { Router } from 'express';
import logger from '../../lib/logger/index.js';
import { addListeningTask, taskQueue } from './listening.service.js';

const router = Router();

router.post('', async (req, res, next) => {
  if (!req.body.listeningData) {
    res.status(400).json({ message: 'No listening information was provided.' });
  } else {
    const jobId = await addListeningTask(req.body.listeningData);

    if (!jobId) {
      logger.error('Job ID could not be allocated.');
      next(new Error('Job ID could not be allocated.'));
    }

    res.json({ jobId });
  }
});

router.get('', async (req, res, next) => {
  if (!req.query.jobId) {
    res.status(400).json({ message: 'No job ID was provided.' });
  } else {
    const jobId = req.query.jobId as string;
    const job = await taskQueue.getJob(jobId);

    if (!job) {
      res.status(400).json({ message: 'No job found for the provided job ID.' });
    } else if (await job.isActive()) {
      res.status(400).json({ message: 'The job is active.' });
    } else {
      res.json({ listeningInfo: job.returnvalue });
      job.remove();
    }
  }
});

export default router;
