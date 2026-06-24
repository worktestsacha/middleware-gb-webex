import express from 'express';
import 'dotenv/config';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler }     from './middleware/errorHandler.js';
import { webhookRouter }    from './routes/webhook.js';
import { apiRouter } from './routes/api.js';

const app = express();

app.use(loggerMiddleware);
app.use(express.json());

app.use('/webhooks', webhookRouter);
app.use('/api', apiRouter);

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Middleware démarré sur le port ${process.env.PORT}`)
);