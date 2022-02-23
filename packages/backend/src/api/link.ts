import express from 'express';

const router = express.Router();

router
  .route('/link')
  .get(async (req, res, next) => {
    try {

    } catch (err) {
      next(new HttpInternalError(err));
    }
});