import express from 'express';
import history from 'connect-history-api-fallback';
import path from 'path';
import './envConfig';
import setupRoutes from './setupRoutes';
import errorMiddleware from './middlewares/error';
import cacheMiddleware from './middlewares/cache';
import userMiddleware from './middlewares/user';

import { User } from './api/daos/UserDao'; // eslint-disable-line

declare global {
  namespace Express {
    interface Request {
      user: User | null;
    }
  }
}

const app = express();

// Prevent CORS issue inside Docker
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // const origin = req.get('origin');

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
    );

    // intercept OPTIONS
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });
}

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(userMiddleware);
app.use(cacheMiddleware);
setupRoutes(app);

app.use(errorMiddleware);

app.use(history());
app.use(express.static(path.join(__dirname, '../dist')));

app.listen(8081, () => {
  console.log('Listening on port 8081');
});
