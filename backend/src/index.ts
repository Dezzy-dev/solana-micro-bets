import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import betRoutes from './routes/bet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Micro-Bets backend running');
});

app.use('/api', betRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

