import express from 'express';
import history from 'connect-history-api-fallback';
import path from 'path';
import cookieParser from 'cookie-parser';
import errorMiddleware from '@/middlewares/error';
import knex from '@/connection';
import '../envConfig';
import setupRoutes from './setupRoutes';
import cacheMiddleware from './middlewares/cache';
import userMiddleware from './middlewares/user';

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma'
  );

  // intercept OPTIONS
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(userMiddleware);
app.use(cacheMiddleware);
setupRoutes(app);

app.use(errorMiddleware);

app.use(history());
app.use(express.static(path.join(__dirname, '../../dist')));

app.use(async (_req, _res, next) => {
  await knex.destroy();
  next();
});

export default app;
