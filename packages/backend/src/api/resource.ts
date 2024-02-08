import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { UploadImageDataPayload } from '@oare/types';
import AWS from 'aws-sdk';
import express from 'express';
import fileUpload from 'express-fileupload';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/resource/images')
  .post(permissionsRoute('UPLOAD_EPIGRAPHY_IMAGES'), async (req, res, next) => {
    try {
      const ResourceDao = sl.get('ResourceDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');

      const {
        resources,
        links,
        itemProperties,
      }: UploadImageDataPayload = req.body;

      await utils.createTransaction(async trx => {
        await Promise.all(
          resources.map(row => ResourceDao.insertResourceRow(row, trx))
        );

        await Promise.all(
          links.map(row => ResourceDao.insertLinkRow(row, trx))
        );

        await ItemPropertiesDao.insertItemPropertyRows(itemProperties, trx);
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/resource/upload_image/:key')
  .post(permissionsRoute('ADD_NEW_TEXTS'), async (req, res, next) => {
    try {
      const s3 = new AWS.S3();

      const { key } = req.params;

      if (!req.files) {
        next(new HttpBadRequest('No file uploaded'));
        return;
      }

      const file = req.files.newFile as fileUpload.UploadedFile;

      const params: AWS.S3.PutObjectRequest = {
        Bucket: 'oare-image-bucket',
        Key: key,
        Body: file.data,
      };

      await s3.putObject(params).promise();

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
