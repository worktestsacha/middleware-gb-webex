import express from 'express';
import 'dotenv/config';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler }     from './middleware/errorHandler.js';
import { webhookRouter }    from './routes/webhook.js';
import { apiRouter } from './routes/api.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/widgets', express.static(path.join(__dirname, 'widgets')));

app.use(loggerMiddleware);
app.use(express.json());

app.use('/webhooks', webhookRouter);
app.use('/api', apiRouter);

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Middleware démarré sur le port ${process.env.PORT}`)
);