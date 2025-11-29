import express from 'express';

const router = express.Router();

router.post('/bet', (req, res) => {
  res.json({ message: 'bet endpoint working' });
});

export default router;

