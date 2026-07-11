import express from 'express';

const router = express.Router();

router.get('/:id/messages', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/:id/messages', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

export default router;
