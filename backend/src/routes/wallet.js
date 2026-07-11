import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/transactions', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/withdraw', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;
