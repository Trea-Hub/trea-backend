import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/events', eventsRouter);

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
