import express from 'express';
import RefreshTokenDao from './daos/RefreshTokenDao';

const router = express.Router();

// TODO logout also destroys refreshToken
router.route('/logout').get(async (req, res) => {
  if (req.user) {
    await RefreshTokenDao.deleteToken(req.user?.email, req.ip);
  }

  const options = {
    secure: process.env.NODE_ENV !== 'development',
    expires: new Date(new Date().getTime() - 1),
  };

  res
    .cookie('refreshToken', '', options)
    .cookie('jwt', '', options)
    .status(200)
    .end();
});

export default router;
