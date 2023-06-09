import { HttpInternalError } from '@/exceptions';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { InsertItemPropertyRow, LinkRow, ResourceRow } from '@oare/types';
import AWS from 'aws-sdk';
import express from 'express';
import fileUpload from 'express-fileupload';
import sl from '@/serviceLocator';

// FIXME - major revamp

const router = express.Router();

router
  .route('/text_epigraphies/additional_images')
  .post(permissionsRoute('UPLOAD_EPIGRAPHY_IMAGES'), async (req, res, next) => {
    try {
      const ResourceDao = sl.get('ResourceDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');
      const utils = sl.get('utils');

      const {
        resources,
        links,
        itemProperties,
      }: {
        resources: ResourceRow[];
        links: LinkRow[];
        itemProperties: InsertItemPropertyRow[];
      } = req.body;

      await utils.createTransaction(async trx => {
        await Promise.all(
          resources.map(row => ResourceDao.insertResourceRow(row, trx))
        );

        await Promise.all(
          links.map(row => ResourceDao.insertLinkRow(row, trx))
        );

        await ItemPropertiesDao.addProperties(itemProperties, trx);
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_epigraphies/upload_image/:key')
  .post(permissionsRoute('ADD_NEW_TEXTS'), async (req, res, next) => {
    try {
      const s3 = new AWS.S3();
      const { key } = req.params;

      if (!req.files) {
        res.status(400).end();
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
