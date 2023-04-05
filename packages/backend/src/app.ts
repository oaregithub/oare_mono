import express from 'express';
import history from 'connect-history-api-fallback';
import path from 'path';
import errorMiddleware from '@/middlewares/error';
import fileupload from 'express-fileupload';
import setupRoutes from './setupRoutes';
import userMiddleware from './middlewares/user';
import localeMiddleware from './middlewares/locale';

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Locale'
  );

  // intercept OPTIONS
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(
  express.urlencoded({
    limit: '2mb',
    extended: true,
  })
);
app.use(userMiddleware);
app.use(localeMiddleware);
app.use(fileupload());

setupRoutes(app);

app.use(errorMiddleware);

app.use(history());
app.use(express.static(path.join(__dirname, '../../dist')));

export default app;
