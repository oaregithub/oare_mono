import express from 'express';
import { HttpInternalError } from '@/exceptions';

const router = express.Router();

router.route('/permissions/:type').get(async (req, res, next) => {
  try {
    const { type } = req.params;
    if (type === 'dictionary') {
      const canEdit = req.user?.isAdmin || false;
      res.json({
        canEdit,
      });
      return;
    }
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
