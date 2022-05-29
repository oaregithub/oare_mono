import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';

const router = express.Router();

router.route('/bibliography').get(async (req, res, next) => {
  try {
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/bibliography/:style').get(async (req, res, next) => {
  const style = req.params.style as string;
});

export default router;
