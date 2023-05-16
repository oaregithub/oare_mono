import express from 'express';
import history from 'connect-history-api-fallback';
import path from 'path';
import errorMiddleware from '@/middlewares/error';
import fileupload from 'express-fileupload';
import setupRoutes from './setupRoutes';
import userMiddleware from './middlewares/user';
import localeMiddleware from './middlewares/locale';

/**
 * Initialized Express app.
 */
const app = express();

app.use((req, res, next) => {
  // Sets CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Locale'
  );

  // Intercept OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

// Parses JSON and urlencoded data
app.use(express.json({ limit: '3mb' }));
app.use(
  express.urlencoded({
    limit: '3mb',
    extended: true,
  })
);

// Applies application middleware
app.use(userMiddleware);
app.use(localeMiddleware);
app.use(fileupload());

// Sets up API routes
setupRoutes(app);

// Error handling
app.use(errorMiddleware);

// Adds support for Single Page Applications static routing
app.use(history());

// Serves static files
app.use(express.static(path.join(__dirname, '../../dist')));

export default app;
