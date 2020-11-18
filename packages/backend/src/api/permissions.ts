import express from 'express';
import { HttpInternalError } from '@/exceptions';
import { PermissionResponse } from '@oare/types';

const router = express.Router();

router.route('/permissions').get(async (req, res, next) => {
  try {
    const { user } = req;

    const permissions: PermissionResponse = {
      dictionary: [],
    };

    if (user && user.isAdmin) {
      permissions.dictionary = [
        'ADD_TRANSLATION',
        'DELETE_TRANSLATION',
        'UPDATE_FORM',
        'UPDATE_TRANSLATION',
        'UPDATE_TRANSLATION_ORDER',
        'UPDATE_WORD_SPELLING',
        'ADD_SPELLING',
      ];
    }

    res.json(permissions);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
