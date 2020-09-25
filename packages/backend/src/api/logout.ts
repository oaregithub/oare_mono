import express from 'express';

const router = express.Router();

// TODO logout also destroys refreshToken
router.route('/logout').get((_req, res) => {
  res
    .cookie('jwt', '', {
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(new Date().getTime() - 1),
    })
    .status(200)
    .end();
});

export default router;
