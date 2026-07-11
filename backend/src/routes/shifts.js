import express from 'express';

const router = express.Router();

router.post('/start', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/stop', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/current', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/last', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;
