import express from 'express';

const router = express.Router();

router.get('/current', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/next', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.patch('/:id/status', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;
