import express from 'express';
import HttpException from '@/exceptions/HttpException';

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
    next(new HttpException(500, err));
  }
});

export default router;
